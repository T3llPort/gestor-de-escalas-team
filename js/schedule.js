/* Tela da escala semanal: visualização por semana, ajustes manuais, escolha da escala de horário
   de cada funcionário, alertas, exportação e impressão. */
(function (App) {
  const U = App.util;
  const S = App.store;
  const R = App.scale;
  const esc = U.escapeHtml;

  const MESES_CURTOS = U.MESES.map((m) => m.slice(0, 3).toLowerCase());
  const DIAS_CABECALHO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const view = {
    weekStart: U.mondayOf(new Date()),
    busca: '',
    brush: 'toggle'
  };

  const BRUSHES = [
    { id: 'toggle', label: 'Trabalho ou folga', title: 'Clique para alternar entre trabalho e folga' },
    { id: 'FE', label: 'Férias', title: 'Clique ou arraste para marcar férias' },
    { id: 'AT', label: 'Afastamento', title: 'Clique ou arraste para marcar afastamento ou atestado' },
    { id: 'T', label: 'Marcar trabalho', title: 'Clique ou arraste para voltar a dia de trabalho' }
  ];

  let rootEl = null;

  function filtered() {
    const q = U.normalize(view.busca);
    return S.employees().filter((e) => !q || U.normalize(e.nome).includes(q));
  }

  function weekDays() {
    const days = [];
    for (let i = 0; i < 7; i++) days.push(U.addDays(view.weekStart, i));
    return days;
  }

  // "26 out – 1 nov" (ou "5 – 11 out" quando a semana fica no mesmo mês).
  function weekTitle(start, end) {
    const a = start.getDate(), b = end.getDate();
    if (start.getMonth() === end.getMonth()) return `${a} – ${b} ${MESES_CURTOS[end.getMonth()]}`;
    return `${a} ${MESES_CURTOS[start.getMonth()]} – ${b} ${MESES_CURTOS[end.getMonth()]}`;
  }

  function weekYears(start, end) {
    return start.getFullYear() === end.getFullYear()
      ? String(end.getFullYear())
      : start.getFullYear() + '/' + end.getFullYear();
  }

  function shiftOf(emp) {
    return R.fixedShift(emp);
  }

  // Etiqueta do tipo do turno: abertura, fechamento ou nada (intermediário).
  function shiftTag(t) {
    if (!t) return '';
    if (t.abertura && t.fechamento) return '<span class="c-tag t-ab t-fe">Abre e fecha</span>';
    if (t.abertura) return '<span class="c-tag t-ab">Abertura</span>';
    if (t.fechamento) return '<span class="c-tag t-fe">Fechamento</span>';
    return t.nome ? `<span class="c-tag">${esc(t.nome)}</span>` : '';
  }

  function manualMode() {
    return S.config().horarios === 'manual';
  }

  // Ícones de traço (mesmo desenho dos ícones da barra lateral).
  const svg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    left: svg('<path d="M15 18l-6-6 6-6"/>'),
    right: svg('<path d="M9 18l6-6-6-6"/>'),
    regen: svg('<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    print: svg('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>')
  };

  // Números do dia em foco (hoje, se estiver na semana aberta; senão a segunda): trabalhando, de folga,
  // na abertura e no fechamento, contando a empresa toda.
  function dayStats(days, todayKey) {
    const foco = days.find((d) => U.toKey(d) === todayKey) || days[0];
    const key = U.toKey(foco);
    let trab = 0, folga = 0, ab = 0, fe = 0;
    S.employees().forEach((e) => {
      const v = S.getDay(e.id, key);
      if (v === 'F') folga++;
      if (v !== 'T') return;
      trab++;
      const s = R.shiftForDay(e, key);
      if (s && s.abertura) ab++;
      if (s && s.fechamento) fe++;
    });
    const quando = (U.toKey(foco) === todayKey ? 'hoje, ' : '') + DIAS_CABECALHO[foco.getDay()].toLowerCase() + ' ' +
      U.pad(foco.getDate()) + '/' + U.pad(foco.getMonth() + 1);
    const tile = (label, n) => `<div class="stat"><div class="stat-label">${label} <span>${quando}</span></div><div class="stat-num">${n}</div></div>`;
    return `<div class="band-stats">${tile('Trabalhando', trab)}${tile('De folga', folga)}${tile('Na abertura', ab)}${tile('No fechamento', fe)}</div>`;
  }

  // Iniciais do nome para o avatar (primeiro e último nome).
  function initials(nome) {
    const partes = String(nome).trim().split(/\s+/);
    return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
  }

  const HORARIO_LABELS = { entrada: 'Entrada', saidaAlmoco: 'Saída para almoço', voltaAlmoco: 'Volta do almoço', saida: 'Encerramento' };

  // Conteúdo de uma célula da semana. Nos dias de trabalho mostra a manhã (entrada até a saída
  // para almoço) em cima e a tarde (volta do almoço até o encerramento) embaixo.
  // No modo manual, os quatro horários viram campos editáveis.
  function cellInner(emp, v, key) {
    if (!v) return '';
    if (v === 'F' && R.isCompFolga(emp, key)) {
      return '<span class="c-main">Folga</span><span class="c-sub" title="Compensação do domingo trabalhado">do domingo</span>';
    }
    if (v !== 'T') return `<span class="c-main">${R.STATUS[v].label}</span>`;
    const t = R.dayTimes(emp, key);
    if (manualMode()) {
      const custom = t && t.custom ? ' custom' : '';
      return shiftTag(t) + '<span class="tm-grid">' + R.HORARIOS.map((c) =>
        `<input type="time" class="tm${custom}" data-field="${c}" value="${esc(t ? t[c] : '')}" aria-label="${HORARIO_LABELS[c]}" title="${HORARIO_LABELS[c]}">`
      ).join('') + '</span>';
    }
    if (!t) return '<span class="c-main">Trabalho</span>';
    return shiftTag(t) + `<span class="c-time">${esc(t.entrada)}–${esc(t.saidaAlmoco)}</span>` +
      `<span class="c-time out">${esc(t.voltaAlmoco)}–${esc(t.saida)}</span>`;
  }

  function cellTip(emp, d, key, v) {
    let tip = U.DIAS_NOMES[d.getDay()] + ', ' + U.formatDateBR(key) + ': ' + (v ? R.STATUS[v].label : 'sem escala');
    if (v === 'T') {
      const t = R.dayTimes(emp, key);
      if (t) {
        if (t.nome) tip += ' na escala ' + t.nome;
        if (t.custom) tip += ' (horário ajustado)';
        R.HORARIOS.forEach((c) => { if (t[c]) tip += '\n' + HORARIO_LABELS[c] + ': ' + t[c]; });
      }
    }
    return tip;
  }

  function render(root) {
    rootEl = root;
    const allEmps = S.employees();
    const days = weekDays();
    const start = days[0], end = days[6];
    if (allEmps.length) {
      R.ensureYear(start.getFullYear());
      if (end.getFullYear() !== start.getFullYear()) R.ensureYear(end.getFullYear());
    }

    const cfg = S.config();
    const manual = cfg.horarios === 'manual';
    const comLimite = S.departamentos().filter((d) => S.limiteFolgas(d)).length;
    const escalasValidas = R.validShifts().length;
    // Dias de trabalho sem horário (ex.: folga trocada por trabalho) recebem um, respeitando o descanso.
    if (allEmps.length && escalasValidas) R.fillShifts(U.addDays(start, -1), end);

    const todayKey = U.toKey(new Date());
    const isThisWeek = U.toKey(U.mondayOf(new Date())) === U.toKey(start);
    const emps = filtered();
    const val = R.validateRange(start, end, emps);
    if (App.setAlertBadge) App.setAlertBadge(val.alerts.length);

    root.innerHTML = `
      <section class="week-band">
        <div class="band-top">
          <div>
            <div class="band-eyebrow">Escala da semana</div>
            <h1>${weekTitle(start, end)} <span class="year">${weekYears(start, end)}</span></h1>
            <p class="band-lead" title="Nos dias de trabalho, a linha de cima vai da entrada à saída para almoço, e a de baixo, da volta do almoço ao encerramento.">
              ${R.JORNADA_SEMANAL} por semana em 5 dias, 2 folgas nunca seguidas e 1 folga a mais depois de domingo trabalhado.
              Clique num dia para trocar trabalho e folga, ou no nome para escolher o horário.</p>
          </div>
          <div class="week-nav">
            <button class="ghost-btn square" data-week="-1" aria-label="Semana anterior" title="Semana anterior">${ICON.left}</button>
            <button class="ghost-btn" id="btn-today" ${isThisWeek ? 'disabled' : ''}>Esta semana</button>
            <button class="ghost-btn square" data-week="1" aria-label="Próxima semana" title="Próxima semana">${ICON.right}</button>
            <input type="date" id="week-date" value="${U.toKey(start)}" aria-label="Ir para a semana de uma data" title="Ir para a semana de uma data">
          </div>
        </div>
        ${allEmps.length ? dayStats(days, todayKey) : ''}
      </section>

      ${!allEmps.length ? `
        <div class="card empty big">
          <p>Ainda não há funcionários</p>
          <p class="muted">Cadastre ou importe a equipe e a escala do ano inteiro é montada automaticamente.</p>
          <a class="btn primary" href="#funcionarios">Cadastrar funcionários</a>
        </div>` : `

      <div class="toolbar">
        <div class="tool-group">
          <input type="search" id="sched-search" placeholder="Buscar funcionário" value="${esc(view.busca)}">
        </div>
        <div class="tool-group brushes" role="radiogroup" aria-label="Ferramenta de edição">
          ${BRUSHES.map((b) => `<button class="brush ${b.id === view.brush ? 'active' : ''} b-${b.id}" data-brush="${b.id}" title="${b.title}" role="radio" aria-checked="${b.id === view.brush}">${b.label}</button>`).join('')}
        </div>
        <div class="tool-group">
          <button class="icon-btn" id="btn-regen" title="Regenerar" aria-label="Regenerar">${ICON.regen}</button>
          <button class="icon-btn" id="btn-export" title="Exportar CSV" aria-label="Exportar CSV">${ICON.download}</button>
          <button class="btn primary" id="btn-print">${ICON.print}Imprimir</button>
        </div>
      </div>

      <div class="options-bar card">
        <div class="opt">
          <span class="opt-label" id="lbl-horarios">Horários do dia</span>
          <div class="segmented" role="radiogroup" aria-labelledby="lbl-horarios">
            <button type="button" role="radio" data-horarios="auto" aria-checked="${!manual}" class="${manual ? '' : 'active'}"
              title="Usa os horários da escala de cada dia, escolhida pelo rodízio de abertura e fechamento">Automático pela escala</button>
            <button type="button" role="radio" data-horarios="manual" aria-checked="${manual}" class="${manual ? 'active' : ''}"
              title="Permite digitar a entrada, o almoço e o encerramento de cada funcionário em cada dia">Manual, dia a dia</button>
          </div>
          ${escalasValidas ? `
            <button type="button" class="btn small-btn" id="btn-redistribuir"
              title="Refaz o rodízio de abertura e fechamento desta semana até dezembro">Redistribuir horários</button>` : `
            <span class="small muted">Nenhuma escala de horário cadastrada. <a href="#configuracoes">Cadastrar em Configurações</a></span>`}
        </div>
        <div class="opt opt-end">
          <span class="opt-label">Limite de folgas</span>
          <span class="muted">${comLimite ? `${comLimite} de ${S.departamentos().length} ${U.plural(S.departamentos().length, 'departamento', 'departamentos')}` : 'sem limite'}</span>
          <a href="#configuracoes" class="opt-link" title="Alterar em Configurações">Alterar</a>
        </div>
      </div>

      <div class="status-line">
        <span class="chip">${emps.length} ${U.plural(emps.length, 'funcionário', 'funcionários')}</span>
        ${val.alerts.length
          ? `<a class="chip danger" href="#alertas">${val.alerts.length} ${U.plural(val.alerts.length, 'alerta de regra', 'alertas de regra')}</a>`
          : '<span class="chip ok">Semana dentro das regras</span>'}
        <span class="legend">
          <span class="legend-item"><span class="sw sw-ab"></span>Abertura</span>
          <span class="legend-item"><span class="sw sw-fe"></span>Fechamento</span>
          <span class="legend-item"><span class="sw sw-F"></span>Folga</span>
          <span class="legend-item"><span class="sw sw-FE"></span>Férias</span>
          <span class="legend-item"><span class="sw sw-AT"></span>Afastamento</span>
          <span class="legend-item"><span class="sw sw-sun"></span>Domingo</span>
        </span>
      </div>

      <div class="print-title">Escala da semana de ${U.formatDateBR(U.toKey(start))} a ${U.formatDateBR(U.toKey(end))}</div>

      ${emps.length ? `
      <div class="grid-wrap card">
        <table class="grid week" id="grid">
          <thead>
            <tr>
              <th class="name-col">Funcionário</th>
              ${days.map((d) => {
                const key = U.toKey(d);
                const over = val.overDays.get(key);
                return `
                <th class="day-h ${d.getDay() === 0 ? 'sun' : ''} ${key === todayKey ? 'today' : ''} ${over ? 'over' : ''}"
                  title="${esc(U.DIAS_NOMES[d.getDay()] + (over ? '\nAcima do limite de folgas: ' +
                    over.map((o) => `${o.dept} com ${o.n} de folga (limite ${o.limite})`).join('; ') : ''))}">
                  <span class="dh-dow">${DIAS_CABECALHO[d.getDay()]}</span>
                  <span class="dh-date">${U.pad(d.getDate())}/${U.pad(d.getMonth() + 1)}</span>
                  ${over ? `<span class="dh-over">${over.length === 1 ? esc(over[0].dept) : over.length + ' departamentos'} acima</span>` : ''}
                </th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${emps.map((e) => rowHtml(e, days, val, todayKey)).join('')}
          </tbody>
        </table>
      </div>` : '<div class="card empty">Nenhum funcionário encontrado com essa busca.</div>'}

      ${val.alerts.length ? `
      <section class="card alerts" id="alertas">
        <h2>Alertas de regra</h2>
        <ul>
          ${val.alerts.map((a) => `
            <li class="alert-${a.type}">
              ${a.emp ? `<strong>${esc(a.emp.nome)}</strong>: ${esc(a.msg)}` : `<strong>${esc(a.msg)}</strong>`}
              ${a.emp && a.type !== 'semana' ? `<span class="muted">(${U.formatDateBR(a.key)})</span>` : ''}
            </li>`).join('')}
        </ul>
      </section>` : ''}
      `}`;

    bind(root, emps);
  }

  function rowHtml(e, days, val, todayKey) {
    const s = shiftOf(e);
    return `<tr data-emp="${e.id}">
      <th class="name-col">
        <button type="button" class="emp-btn" data-pick="${e.id}" title="Escolher entre o rodízio de horários ou uma escala fixa para ${esc(e.nome)}">
          <span class="emp-avatar" aria-hidden="true">${esc(initials(e.nome))}</span>
          <span class="emp-info">
            <span class="emp-line">
              <span class="emp-name">${esc(e.nome)}</span>
              <span class="sex-dot ${e.sexo}" role="img" aria-label="${e.sexo === 'M' ? 'Masculino' : 'Feminino'}"></span>
            </span>
            <span class="emp-shift ${s ? 'fixo' : ''}">${s
              ? `Fixo: ${esc(s.nome)} <span class="emp-hours">${esc(s.entrada)} às ${esc(s.saida)}</span>`
              : `${esc(S.deptOf(e))}, rodízio`}</span>
          </span>
        </button>
      </th>
      ${days.map((d) => {
        const key = U.toKey(d);
        const v = S.getDay(e.id, key) || '';
        const id = R.cellId(e.id, key);
        const errs = val.cells.get(id);
        const warn = val.weekWarn.has(id);
        const cls = ['cell', 's-' + (v || 'none')];
        if (d.getDay() === 0) cls.push('sun');
        if (key === todayKey) cls.push('today');
        if (errs) cls.push('err');
        if (warn) cls.push('warn');
        const tip = cellTip(e, d, key, v) +
          (errs ? '\n⚠ ' + errs.join('\n⚠ ') : '') + (warn ? '\n⚠ Semana fora do 5x2' : '');
        return `<td class="${cls.join(' ')}" data-key="${key}" title="${esc(tip)}">${cellInner(e, v, key)}</td>`;
      }).join('')}
    </tr>`;
  }

  // ---------- Escolha da escala de horário do funcionário ----------
  async function pickShift(emp) {
    const list = S.shifts();
    if (!list.length) {
      const go = await U.modal({
        title: 'Escala de ' + emp.nome,
        body: '<p>Nenhuma escala de horário foi cadastrada ainda. Cadastre as escalas em Configurações e depois volte aqui para escolher.</p>',
        buttons: [{ label: 'Fechar', value: false }, { label: 'Ir para Configurações', value: true, kind: 'primary' }]
      });
      if (go) location.hash = '#configuracoes';
      return;
    }
    const opt = (value, title, lines, checked) => `
      <label class="shift-option">
        <input type="radio" name="shift" value="${value}" ${checked ? 'checked' : ''}>
        <span class="so-text">
          <strong>${title}</strong>
          ${lines.map((l) => `<span class="muted">${l}</span>`).join('')}
        </span>
      </label>`;
    const fixa = R.fixedShift(emp);
    const tipo = (s) => s.abertura && s.fechamento ? 'abertura e fechamento' : s.abertura ? 'abertura' : s.fechamento ? 'fechamento' : 'intermediário';
    const body = `
      <div class="shift-options">
        ${opt('', 'Rodízio automático', ['O sistema alterna os horários cadastrados entre abertura e fechamento,',
          'sempre com 11h de descanso entre um turno e outro'], !fixa)}
        ${list.map((s) => {
          const info = R.shiftInfo(s);
          return opt(s.id, 'Fixo: ' + esc(s.nome) + ` <span class="muted">(${tipo(s)})</span>`, [
            `Entrada ${esc(s.entrada)}, almoço das ${esc(s.saidaAlmoco)} às ${esc(s.voltaAlmoco)}, encerramento ${esc(s.saida)}`,
            info.erro ? 'Horários inválidos' : R.formatHoras(info.trabalho) + ' de trabalho todos os dias'
          ], fixa && fixa.id === s.id);
        }).join('')}
      </div>
      <p class="small"><a href="#configuracoes" data-close-modal>Gerenciar escalas em Configurações</a></p>`;

    let escolhida = null;
    const ok = await U.modal({
      title: 'Escala de ' + emp.nome,
      body,
      onOpen: (el) => {
        const link = el.querySelector('[data-close-modal]');
        link.addEventListener('click', () => el.querySelector('[data-close]').click());
      },
      buttons: [
        { label: 'Cancelar', value: false },
        { label: 'Salvar', value: true, kind: 'primary',
          validate: (el) => { escolhida = el.querySelector('input[name="shift"]:checked').value; return true; } }
      ]
    });
    if (!ok) return;
    const s = escolhida ? S.getShift(escolhida) : null;
    if ((fixa ? fixa.id : '') === (escolhida || '')) return;
    S.setEmployeeShift(emp.id, escolhida || null);
    S.addLog({
      acao: 'Escala de horário do funcionário', empId: emp.id, empNome: emp.nome,
      de: fixa ? 'Fixo: ' + fixa.nome : 'Rodízio', para: s ? 'Fixo: ' + s.nome : 'Rodízio'
    });
    // Voltando ao rodízio, os dias desta semana em diante recebem horários do rodízio.
    if (!s) R.assignShifts([S.getEmployee(emp.id)], view.weekStart, new Date(view.weekStart.getFullYear(), 11, 31), true);
    U.toast(s ? `${emp.nome} agora trabalha sempre na escala ${s.nome}.` : `${emp.nome} voltou para o rodízio de horários.`, 'success');
    render(rootEl);
  }

  // ---------- Edição ----------
  function nextValue(current) {
    if (view.brush === 'toggle') return current === 'F' ? 'T' : 'F';
    return view.brush;
  }

  let drag = null; // { empId, value, changed, blocked }

  function applyCell(td, value) {
    const empId = td.parentElement.dataset.emp;
    const key = td.dataset.key;
    const emp = S.getEmployee(empId);
    if (S.getDay(empId, key) === value) return;
    const err = R.checkChange(emp, key, value);
    if (err) {
      if (!drag || !drag.blocked) U.toast(err, 'error');
      if (drag) drag.blocked = true;
      return;
    }
    const antes = S.getDay(empId, key);
    S.setDay(empId, key, value, true);
    S.addLog({
      acao: 'Dia da escala', empId, empNome: emp.nome, data: key,
      de: antes ? R.STATUS[antes].label : 'Sem escala', para: R.STATUS[value].label
    }, true);
    td.className = td.className.replace(/\bs-\S+/, 's-' + value);
    td.innerHTML = cellInner(emp, value, key);
    if (drag) drag.changed = true;
  }

  function finishDrag() {
    if (!drag) return;
    const changed = drag.changed;
    drag = null;
    if (changed) {
      S.save();
      const scroll = rootEl.querySelector('.grid-wrap');
      const sx = scroll ? scroll.scrollLeft : 0;
      const sy = window.scrollY;
      render(rootEl);
      const w = rootEl.querySelector('.grid-wrap');
      if (w) w.scrollLeft = sx;
      window.scrollTo(0, sy);
    }
  }

  // Horário digitado numa célula (modo manual). Igual ao da escala, o ajuste do dia é apagado.
  function changeTimes(td) {
    const emp = S.getEmployee(td.parentElement.dataset.emp);
    const key = td.dataset.key;
    const t = {};
    R.HORARIOS.forEach((c) => { t[c] = td.querySelector(`[data-field="${c}"]`).value; });
    const s = R.shiftForDay(emp, key);
    // O dia mantém o tipo do turno da escala (abertura/fechamento) para a regra de descanso.
    const comTipo = Object.assign({ id: s && s.id, abertura: !!(s && s.abertura), fechamento: !!(s && s.fechamento) }, t);
    const err = R.checkTimes(t) || R.restIssueAround(emp, key, comTipo);
    if (err) {
      U.toast(err, 'error');
      td.innerHTML = cellInner(emp, 'T', key);
      return;
    }
    const antes = R.dayTimes(emp, key);
    const igualEscala = s && R.HORARIOS.every((c) => s[c] === t[c]);
    const vazio = R.HORARIOS.every((c) => !t[c]);
    S.setTime(emp.id, key, igualEscala || vazio ? null : t);
    const fmt = (x) => x ? `${x.entrada || '--:--'}–${x.saidaAlmoco || '--:--'} / ${x.voltaAlmoco || '--:--'}–${x.saida || '--:--'}` : 'Sem horário';
    S.addLog({ acao: 'Horário do dia', empId: emp.id, empNome: emp.nome, data: key, de: fmt(antes), para: fmt(R.dayTimes(emp, key)) });
    const custom = !!S.getTime(emp.id, key);
    td.querySelectorAll('input.tm').forEach((i) => i.classList.toggle('custom', custom));
    td.title = cellTip(emp, U.fromKey(key), key, 'T');
  }

  function goToWeek(date) {
    view.weekStart = U.mondayOf(date);
    render(rootEl);
  }

  function bind(root, emps) {
    root.querySelectorAll('[data-week]').forEach((b) => b.addEventListener('click', () => {
      goToWeek(U.addDays(view.weekStart, 7 * Number(b.dataset.week)));
    }));
    root.querySelector('#btn-today').addEventListener('click', () => goToWeek(new Date()));
    root.querySelector('#week-date').addEventListener('change', (e) => {
      if (e.target.value) goToWeek(U.fromKey(e.target.value));
    });

    const search = root.querySelector('#sched-search');
    if (!search) return; // sem funcionários: não há ferramentas nem grade
    let t = null;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        view.busca = search.value;
        render(root);
        const s = root.querySelector('#sched-search');
        s.focus();
        s.setSelectionRange(s.value.length, s.value.length);
      }, 250);
    });

    root.querySelectorAll('[data-brush]').forEach((b) => b.addEventListener('click', () => {
      view.brush = b.dataset.brush;
      root.querySelectorAll('[data-brush]').forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', x === b);
      });
    }));

    root.querySelectorAll('[data-horarios]').forEach((b) => b.addEventListener('click', () => {
      if (S.config().horarios === b.dataset.horarios) return;
      S.setConfig({ horarios: b.dataset.horarios });
      S.addLog({ acao: 'Modo dos horários', de: b.dataset.horarios === 'manual' ? 'Automático' : 'Manual', para: b.dataset.horarios === 'manual' ? 'Manual' : 'Automático' });
      U.toast(b.dataset.horarios === 'manual'
        ? 'Horários manuais: digite a entrada, o almoço e o encerramento direto nos dias de trabalho.'
        : 'Horários automáticos: cada dia usa os horários da escala escolhida pelo rodízio.', 'success');
      render(rootEl);
    }));
    const redistribuir = root.querySelector('#btn-redistribuir');
    if (redistribuir) redistribuir.addEventListener('click', redistribute);

    root.querySelector('#btn-regen').addEventListener('click', () => regenerate(emps));
    root.querySelector('#btn-export').addEventListener('click', () => exportCSV(emps));
    root.querySelector('#btn-print').addEventListener('click', printMonthDialog);

    const grid = root.querySelector('#grid');
    if (!grid) return;
    grid.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => pickShift(S.getEmployee(b.dataset.pick))));
    grid.addEventListener('change', (ev) => {
      if (ev.target.matches('input.tm')) changeTimes(ev.target.closest('td.cell'));
    });
    grid.addEventListener('mousedown', (ev) => {
      const td = ev.target.closest('td.cell');
      if (!td || ev.button !== 0 || ev.target.closest('input')) return;
      ev.preventDefault();
      const cur = S.getDay(td.parentElement.dataset.emp, td.dataset.key);
      drag = { empId: td.parentElement.dataset.emp, value: nextValue(cur), changed: false, blocked: false };
      applyCell(td, drag.value);
    });
    grid.addEventListener('mouseover', (ev) => {
      if (!drag) return;
      const td = ev.target.closest('td.cell');
      if (td && td.parentElement.dataset.emp === drag.empId) applyCell(td, drag.value);
    });
  }

  document.addEventListener('mouseup', finishDrag);

  // ---------- Imprimir (escala mensal) ----------
  // Mês sugerido: o da quinta-feira da semana aberta, que é o mês com mais dias dessa semana.
  function defaultPrintMonth() {
    const qui = U.addDays(view.weekStart, 3);
    return { year: qui.getFullYear(), month: qui.getMonth() };
  }

  async function printMonthDialog() {
    const def = defaultPrintMonth();
    let escolha = def;
    const ok = await U.modal({
      title: 'Imprimir escala mensal',
      body: `
        <p>Imprime a escala do mês inteiro de todos os funcionários, um dia por coluna, em folha A4 deitada.</p>
        <label class="field-block">Mês
          <input type="month" name="mes" value="${def.year}-${U.pad(def.month + 1)}">
        </label>`,
      onOpen: (el) => el.querySelector('[name="mes"]').focus(),
      buttons: [
        { label: 'Cancelar', value: false },
        {
          label: 'Imprimir', value: true, kind: 'primary',
          validate: (el) => {
            const m = /^(\d{4})-(\d{2})$/.exec(el.querySelector('[name="mes"]').value);
            if (!m) return false;
            escolha = { year: Number(m[1]), month: Number(m[2]) - 1 };
            return true;
          }
        }
      ]
    });
    if (ok) App.printView.printMonth(escolha.year, escolha.month);
  }

  // Ctrl+P na tela de escala também imprime a escala mensal (do mês sugerido).
  window.addEventListener('beforeprint', () => {
    if (document.body.classList.contains('printing-month')) return;
    if (!document.querySelector('#view #btn-print') || !S.employees().length) return;
    const def = defaultPrintMonth();
    App.printView.build(def.year, def.month);
  });

  // ---------- Refazer o rodízio de horários ----------
  async function redistribute() {
    const shifts = R.validShifts();
    const fim = new Date(view.weekStart.getFullYear(), 11, 31);
    const ok = await U.confirmDialog('Redistribuir horários',
      `Refaz o rodízio de horários (${shifts.map((s) => esc(s.nome)).join(', ')}) de
      ${U.formatDateBR(U.toKey(view.weekStart))} até ${U.formatDateBR(U.toKey(fim))}: cada cargo fica com gente na abertura
      e no fechamento, cada pessoa alterna entre os turnos, e quem fecha a loja não abre no dia seguinte (11h de descanso).
      Quem tem escala fixa continua nela. Os dias de folga não mudam.`,
      'Redistribuir');
    if (!ok) return;
    R.assignShifts(S.employees(), view.weekStart, fim, true);
    S.addLog({ acao: 'Rodízio de horários refeito', detalhe: `${U.formatDateBR(U.toKey(view.weekStart))} a ${U.formatDateBR(U.toKey(fim))}` });
    U.toast('Rodízio de horários refeito.', 'success');
    render(rootEl);
  }

  // ---------- Regenerar ----------
  async function regenerate(emps) {
    const filtrado = emps.length !== S.employees().length;
    const start = view.weekStart;
    const end = U.addDays(start, 6);
    const fimDoAno = new Date(end.getFullYear(), 11, 31);
    const limites = S.departamentos().filter((d) => S.limiteFolgas(d)).map((d) => `${esc(d)}: ${S.limiteFolgas(d)}`);
    const body = `
      <p>Gera novamente as folgas seguindo o 5x2, a regra de domingos e a folga a mais na semana seguinte a um domingo trabalhado.
        <strong>Ajustes manuais de trabalho e folga no período serão substituídos</strong>; férias e afastamentos são mantidos.</p>
      ${limites.length ? `<p>De segunda a sábado, respeita o máximo de folgas no mesmo dia de cada departamento (${limites.join(', ')}).
        Nos domingos vale o revezamento por sexo, mesmo que passe do limite.</p>` : ''}
      <div class="radio-list">
        <label><input type="radio" name="periodo" value="semana" checked> Somente esta semana (${U.formatDateBR(U.toKey(start)).slice(0, 5)} a ${U.formatDateBR(U.toKey(end)).slice(0, 5)})</label>
        <label><input type="radio" name="periodo" value="ate-dez"> Desta semana até dezembro de ${end.getFullYear()}</label>
      </div>
      ${filtrado ? `<p class="muted">Será aplicado apenas aos ${emps.length} ${U.plural(emps.length, 'funcionário exibido', 'funcionários exibidos')} pela busca.</p>` : ''}`;
    let periodo = 'semana';
    const ok = await U.modal({
      title: 'Regenerar escala',
      body,
      buttons: [{ label: 'Cancelar', value: false }, { label: 'Regenerar', value: true, kind: 'primary',
        validate: (el) => { periodo = el.querySelector('input[name="periodo"]:checked').value; return true; } }]
    });
    if (!ok) return;
    const ate = periodo === 'semana' ? end : fimDoAno;
    R.generateRange(emps, start, ate, true);
    S.addLog({
      acao: 'Escala regenerada',
      detalhe: `${U.formatDateBR(U.toKey(start))} a ${U.formatDateBR(U.toKey(ate))}` +
        (filtrado ? `, ${emps.length} ${U.plural(emps.length, 'funcionário', 'funcionários')} da busca` : ', todos os funcionários')
    });
    U.toast('Escala regenerada.', 'success');
    render(rootEl);
  }

  // ---------- Exportar (semana exibida) ----------
  function exportCSV(emps) {
    const days = weekDays();
    const header = ['Nome', 'CPF', 'Sexo', 'Cargo', 'Escala de horário']
      .concat(days.map((d) => DIAS_CABECALHO[d.getDay()] + ' ' + U.formatDateBR(U.toKey(d))))
      .concat(['Dias trabalhados', 'Horas na semana']);
    const rows = [header];
    emps.forEach((e) => {
      const s = shiftOf(e);
      const st = R.periodStats(e, days[0], days[6]);
      rows.push([e.nome, U.formatCPF(e.cpf), e.sexo, e.cargo, s ? 'Fixo: ' + s.nome : 'Rodízio']
        .concat(days.map((d) => {
          const key = U.toKey(d);
          const v = S.getDay(e.id, key);
          const t = v === 'T' ? R.dayTimes(e, key) : null;
          if (t && t.entrada && t.saida) {
            const nome = t.nome ? t.nome + ': ' : '';
            return nome + (t.saidaAlmoco && t.voltaAlmoco
              ? `${t.entrada} às ${t.saidaAlmoco} e ${t.voltaAlmoco} às ${t.saida}`
              : `${t.entrada} às ${t.saida}`);
          }
          return v ? R.STATUS[v].label : '';
        }))
        .concat([st.trab, st.horas]));
    });
    U.downloadFile(`escala-semana-${U.toKey(days[0])}.csv`, App.csv.toCSV(rows), 'text/csv;charset=utf-8');
  }

  App.scheduleView = { render };
})(window.App);
