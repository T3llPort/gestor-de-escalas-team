/* Armazenamento local (localStorage) de funcionários e escalas, com backup em JSON.
   Cada empresa tem os próprios dados; open(empresaId) escolhe qual empresa está aberta. */
(function (App) {
  // Chave usada antes de existir login e empresas; os dados passam para a primeira empresa.
  const LEGACY_KEY = 'escalas5x2:v1';

  function dataKey(empresaId) { return 'escalas5x2:empresa:' + empresaId; }

  let KEY = null; // null: nenhuma empresa aberta (ex.: usuário master)
  let state = empty();

  function open(empresaId) {
    KEY = empresaId ? dataKey(empresaId) : null;
    state = KEY ? load() : empty();
  }

  // Move os dados antigos (sem empresa) para a empresa informada. Retorna true se havia dados.
  function adoptLegacy(empresaId) {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw || localStorage.getItem(dataKey(empresaId))) return false;
      localStorage.setItem(dataKey(empresaId), raw);
      localStorage.removeItem(LEGACY_KEY);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function removeData(empresaId) {
    try { localStorage.removeItem(dataKey(empresaId)); } catch (e) { console.error(e); }
  }

  // Quantos funcionários a empresa tem, sem precisar abri-la.
  function countEmployees(empresaId) {
    try {
      const d = JSON.parse(localStorage.getItem(dataKey(empresaId)) || 'null');
      return d && Array.isArray(d.employees) ? d.employees.length : 0;
    } catch (e) {
      return 0;
    }
  }

  // shifts: tipos de escala (horários) cadastrados em Configurações.
  // times: horários de entrada e saída ajustados à mão, por funcionário e dia.
  // config.horarios: 'auto' (horários da escala cadastrada) ou 'manual' (editáveis dia a dia).
  // config.maxFolgasDepto: { departamento: até quantas pessoas dele podem folgar no mesmo dia }.
  // dayShift: escala de horário de cada dia de trabalho, por funcionário (rodízio abertura/fechamento).
  // logs: histórico das alterações da jornada feitas pelos usuários (mais recentes no fim).
  const LOG_MAX = 5000;

  function defaultConfig() {
    return { horarios: 'auto', maxFolgasDepto: {} };
  }

  // Departamento usado para distribuir as folgas. Cadastros antigos, sem departamento, usam o cargo.
  function deptOf(emp) {
    return emp.departamento || emp.cargo || 'Sem departamento';
  }

  function empty() {
    return { version: 1, employees: [], schedule: {}, shifts: [], times: {}, dayShift: {}, logs: [], config: defaultConfig() };
  }

  function normalizeState(data) {
    data.schedule = data.schedule || {};
    data.shifts = Array.isArray(data.shifts) ? data.shifts : [];
    data.times = data.times && typeof data.times === 'object' ? data.times : {};
    data.dayShift = data.dayShift && typeof data.dayShift === 'object' ? data.dayShift : {};
    data.logs = Array.isArray(data.logs) ? data.logs : [];
    data.config = Object.assign(defaultConfig(), data.config || {});
    // O limite antigo valia para a empresa toda: passa a valer para cada departamento existente.
    if (data.config.maxFolgasDia) {
      if (!Object.keys(data.config.maxFolgasDepto).length) {
        (data.employees || []).forEach((e) => { data.config.maxFolgasDepto[deptOf(e)] = data.config.maxFolgasDia; });
      }
    }
    delete data.config.maxFolgasDia;
    return data;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.employees)) return empty();
      return normalizeState(data);
    } catch (e) {
      console.error('Falha ao ler dados salvos', e);
      return empty();
    }
  }

  function save() {
    if (!KEY) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error(e);
      App.util.toast('Não foi possível salvar os dados neste navegador.', 'error');
    }
  }

  // Avisa a interface (ex.: resumo da barra lateral) que os funcionários mudaram.
  function notify() {
    document.dispatchEvent(new CustomEvent('escalas:dados'));
  }

  // ---------- Funcionários ----------
  function employees() {
    return state.employees.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function getEmployee(id) {
    return state.employees.find((e) => e.id === id) || null;
  }

  function findByCPF(cpf) {
    const c = App.util.onlyDigits(cpf);
    return state.employees.find((e) => e.cpf === c) || null;
  }

  function cargos() {
    const set = new Set(state.employees.map((e) => e.cargo).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  // Departamentos dos funcionários (cadastros sem departamento entram pelo cargo).
  function departamentos() {
    const set = new Set(state.employees.map(deptOf));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  // Defasagem do ciclo de domingos: coloca o funcionário no grupo de domingo com menos colegas
  // do mesmo departamento e sexo, para que não folguem todos no mesmo domingo.
  // O ciclo tem 3 domingos para homens (2 trabalhados + folga) e 2 para mulheres.
  function nextOffset(emp, excludeId) {
    const ciclo = emp.sexo === 'M' ? 3 : 2;
    const porFase = new Array(ciclo).fill(0);
    state.employees.forEach((e) => {
      if (deptOf(e) === deptOf(emp) && e.sexo === emp.sexo && e.id !== excludeId) porFase[(e.offset || 0) % ciclo]++;
    });
    return porFase.indexOf(Math.min(...porFase));
  }

  function addEmployee(data) {
    const emp = Object.assign({ id: App.util.uid() }, data);
    emp.offset = nextOffset(emp);
    state.employees.push(emp);
    save();
    notify();
    return emp;
  }

  function addEmployees(list) {
    list.forEach((data) => {
      const emp = Object.assign({ id: App.util.uid() }, data);
      emp.offset = nextOffset(emp);
      state.employees.push(emp);
    });
    save();
    notify();
  }

  function updateEmployee(id, data) {
    const emp = getEmployee(id);
    if (!emp) return;
    const antes = deptOf(emp) + '|' + emp.sexo;
    Object.assign(emp, data);
    if (deptOf(emp) + '|' + emp.sexo !== antes) emp.offset = nextOffset(emp, emp.id);
    save();
    notify();
  }

  function removeEmployee(id) {
    state.employees = state.employees.filter((e) => e.id !== id);
    delete state.schedule[id];
    delete state.times[id];
    delete state.dayShift[id];
    save();
    notify();
  }

  // ---------- Tipos de escala (horários) ----------
  // { id, nome, entrada, saidaAlmoco, voltaAlmoco, saida } com horários "HH:MM".
  function shifts() {
    return state.shifts.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function getShift(id) {
    return state.shifts.find((s) => s.id === id) || null;
  }

  function addShift(data) {
    const shift = Object.assign({ id: App.util.uid() }, data);
    state.shifts.push(shift);
    save();
    return shift;
  }

  function updateShift(id, data) {
    const shift = getShift(id);
    if (!shift) return;
    Object.assign(shift, data);
    save();
  }

  // Remove o tipo de escala; quem estava fixo nele volta para o rodízio, e os dias que o usavam
  // recebem outro horário na próxima vez que a escala for aberta.
  function removeShift(id) {
    state.shifts = state.shifts.filter((s) => s.id !== id);
    state.employees.forEach((e) => { if (e.escalaId === id) { delete e.escalaId; delete e.escalaFixa; } });
    Object.values(state.dayShift).forEach((m) => {
      Object.keys(m).forEach((k) => { if (m[k] === id) delete m[k]; });
    });
    save();
    notify();
  }

  // Funcionários com horário fixo nesta escala (os demais fazem rodízio).
  function employeesInShift(id) {
    return state.employees.filter((e) => e.escalaFixa && e.escalaId === id).length;
  }

  // Fixa o funcionário numa escala de horário (todos os dias) ou, com shiftId vazio, volta ao rodízio.
  function setEmployeeShift(empId, shiftId) {
    const emp = getEmployee(empId);
    if (!emp) return;
    if (shiftId) { emp.escalaId = shiftId; emp.escalaFixa = true; } else { delete emp.escalaId; delete emp.escalaFixa; }
    save();
  }

  // ---------- Escala ----------
  // Valores: 'T' trabalho, 'F' folga, 'FE' férias, 'AT' afastamento/atestado.
  function getDay(empId, key) {
    const s = state.schedule[empId];
    return s ? s[key] || null : null;
  }

  function setDay(empId, key, value, silent) {
    if (!state.schedule[empId]) state.schedule[empId] = {};
    if (value) state.schedule[empId][key] = value;
    else delete state.schedule[empId][key];
    if (!silent) save();
  }

  // ---------- Horários do dia (modo manual) ----------
  // { entrada, saidaAlmoco, voltaAlmoco, saida } "HH:MM"; sem registro, o dia usa os horários da escala.
  function getTime(empId, key) {
    const t = state.times[empId];
    return t && t[key] ? t[key] : null;
  }

  function setTime(empId, key, value) {
    if (!state.times[empId]) state.times[empId] = {};
    if (value) state.times[empId][key] = value;
    else delete state.times[empId][key];
    save();
  }

  // ---------- Escala de horário de cada dia ----------
  function getDayShift(empId, key) {
    const m = state.dayShift[empId];
    return m && m[key] ? m[key] : null;
  }

  function setDayShift(empId, key, shiftId, silent) {
    if (!state.dayShift[empId]) state.dayShift[empId] = {};
    if (shiftId) state.dayShift[empId][key] = shiftId;
    else delete state.dayShift[empId][key];
    if (!silent) save();
  }

  // ---------- Histórico de alterações ----------
  // entry: { acao, empId?, empNome?, data?, de?, para?, detalhe? }; usuário e momento são preenchidos aqui.
  function addLog(entry, silent) {
    const u = App.currentUser;
    state.logs.push(Object.assign({
      id: App.util.uid(),
      em: new Date().toISOString(),
      usuarioId: u ? u.id : null,
      usuario: u ? u.nome : 'Sistema'
    }, entry));
    if (state.logs.length > LOG_MAX) state.logs.splice(0, state.logs.length - LOG_MAX);
    if (!silent) save();
  }

  function logs() {
    return state.logs.slice();
  }

  // ---------- Configurações gerais ----------
  function config() {
    return Object.assign({}, state.config);
  }

  function setConfig(patch) {
    Object.assign(state.config, patch);
    save();
  }

  // Limite de pessoas do departamento de folga no mesmo dia (null = sem limite).
  function limiteFolgas(dept) {
    const v = state.config.maxFolgasDepto[dept];
    return v ? v : null;
  }

  function setLimiteFolgas(dept, n) {
    if (n) state.config.maxFolgasDepto[dept] = n;
    else delete state.config.maxFolgasDepto[dept];
    save();
  }

  // ---------- Backup ----------
  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.employees) || typeof data.schedule !== 'object') {
      throw new Error('Arquivo de backup inválido.');
    }
    state = normalizeState({
      version: 1,
      employees: data.employees,
      schedule: data.schedule,
      shifts: data.shifts,
      times: data.times,
      dayShift: data.dayShift,
      logs: data.logs,
      config: data.config
    });
    save();
    notify();
  }

  App.store = {
    open, adoptLegacy, removeData, countEmployees,
    save, employees, getEmployee, findByCPF, cargos, departamentos, deptOf,
    addEmployee, addEmployees, updateEmployee, removeEmployee,
    shifts, getShift, addShift, updateShift, removeShift, employeesInShift, setEmployeeShift,
    getDay, setDay, getTime, setTime, getDayShift, setDayShift, addLog, logs, config, setConfig, limiteFolgas, setLimiteFolgas, exportJSON, importJSON
  };
})(window.App);
