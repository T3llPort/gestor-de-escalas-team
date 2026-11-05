/* Regras da escala 5x2: geração automática e validação.
 *
 * Regras aplicadas:
 *  - Jornada de 42h semanais: 5 dias de 8h24 e 2 folgas por semana (segunda a domingo).
 *  - Domingo trabalhado: a semana seguinte tem uma folga a mais (3 folgas: 2 da jornada e
 *    1 de compensação do domingo).
 *  - As folgas nunca ficam em dias seguidos, inclusive na virada de uma semana para a outra.
 *  - Domingos (sexo masculino): no máximo 2 domingos trabalhados seguidos; o 3º é folga.
 *    Podem folgar antes, e o gerador usa isso para equilibrar os domingos de cada departamento.
 *  - Domingos (sexo feminino): sempre alternando, 1 domingo trabalhado e o seguinte de folga.
 *    Férias/afastamento num domingo interrompem o revezamento, que recomeça trabalhando.
 *  - Rodízio: as folgas são distribuídas para não concentrar muita gente do mesmo departamento
 *    (nem da empresa) de folga no mesmo dia, variando os dias de cada pessoa.
 *  - Limite opcional de pessoas de cada departamento de folga no mesmo dia
 *    (config.maxFolgasDepto), respeitado sempre que as regras obrigatórias permitirem.
 *  - Nunca mais de 6 dias de trabalho consecutivos (descanso semanal).
 */
(function (App) {
  const U = App.util;
  const S = App.store;

  const SUNDAY_LIMIT = { M: 2, F: 1 };
  const MAX_STREAK = 6;
  const FOLGAS_SEMANA = 2;
  const JORNADA_SEMANAL_MIN = 42 * 60;
  const DIAS_TRABALHO = 7 - FOLGAS_SEMANA;
  const JORNADA_DIARIA_MIN = JORNADA_SEMANAL_MIN / DIAS_TRABALHO; // 504 min = 8h24

  // Formata minutos como "42h" ou "8h24".
  function formatHoras(min) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h + 'h' + (m ? U.pad(m) : '');
  }

  const STATUS = {
    T: { label: 'Trabalho', short: 'T' },
    F: { label: 'Folga', short: 'F' },
    FE: { label: 'Férias', short: 'FE' },
    AT: { label: 'Afastamento', short: 'AT' }
  };

  function sundayLimit(emp) { return SUNDAY_LIMIT[emp.sexo] || 1; }

  function isAbsence(v) { return v === 'FE' || v === 'AT'; }

  // Dias de trabalho consecutivos imediatamente antes de `day`.
  function streakBefore(emp, day) {
    let n = 0;
    let d = U.addDays(day, -1);
    while (n < 14) {
      if (S.getDay(emp.id, U.toKey(d)) !== 'T') break;
      n++;
      d = U.addDays(d, -1);
    }
    return n;
  }

  // Dias de trabalho consecutivos a partir de `day` (inclusive), olhando para frente.
  function streakFrom(emp, day) {
    let n = 0;
    let d = day;
    while (n < 14) {
      if (S.getDay(emp.id, U.toKey(d)) !== 'T') break;
      n++;
      d = U.addDays(d, 1);
    }
    return n;
  }

  // Ciclo fixo de domingos (homens: trabalha, trabalha, folga; mulheres: trabalha, folga),
  // defasado por funcionário. É o mesmo em qualquer ano, então anos gerados em qualquer ordem se encaixam.
  function cycleSundayOff(emp, sunday) {
    const limit = sundayLimit(emp);
    const cycle = limit + 1;
    const pos = (((U.weekIndex(sunday) + (emp.offset || 0)) % cycle) + cycle) % cycle;
    return pos === limit;
  }

  function revezamentoTexto(emp) {
    return emp.sexo === 'M'
      ? 'Homens podem trabalhar no máximo 2 domingos seguidos; o 3º tem que ser folga.'
      : 'Mulheres alternam: trabalham 1 domingo e folgam o seguinte.';
  }

  // Mulheres só folgam o domingo logo depois de um domingo trabalhado (alternância).
  // Homens podem folgar qualquer domingo. Domingo anterior sem escala ainda não conta contra.
  function sundayOffAllowed(emp, sunday) {
    if (emp.sexo === 'M') return true;
    const v = S.getDay(emp.id, U.toKey(U.addDays(sunday, -7)));
    return v === null || v === 'T';
  }

  // Domingos trabalhados seguidos logo antes de `sunday`.
  // `known` = false quando a contagem parou num domingo ainda sem escala.
  function workedSundaysBefore(emp, sunday) {
    let count = 0;
    for (let d = U.addDays(sunday, -7); count < 3; d = U.addDays(d, -7)) {
      const v = S.getDay(emp.id, U.toKey(d));
      if (v === 'T') { count++; continue; }
      return { count, known: v !== null };
    }
    return { count, known: true };
  }

  // Domingos trabalhados seguidos logo depois de `sunday` (semanas já geradas).
  function workedSundaysAfter(emp, sunday) {
    let count = 0;
    for (let d = U.addDays(sunday, 7); count < 3; d = U.addDays(d, 7)) {
      if (S.getDay(emp.id, U.toKey(d)) !== 'T') break;
      count++;
    }
    return count;
  }

  // Folga obrigatória: homens depois de 2 domingos trabalhados; mulheres, depois de 1.
  function sundayShouldBeOff(emp, sunday) {
    const limit = sundayLimit(emp);
    let worked = 0;
    let d = U.addDays(sunday, -7);
    while (worked < limit) {
      const v = S.getDay(emp.id, U.toKey(d));
      if (v === 'T') { worked++; d = U.addDays(d, -7); continue; }
      // Histórico incompleto: segue o ciclo fixo para não desalinhar na virada do ano.
      if (v === null) return cycleSundayOff(emp, sunday);
      // Folga, férias ou afastamento no domingo anterior: este domingo é trabalhado.
      return false;
    }
    return true;
  }

  function combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const out = [];
    (function rec(start, acc) {
      if (acc.length === k) { out.push(acc.slice()); return; }
      for (let i = start; i < arr.length; i++) { acc.push(arr[i]); rec(i + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }

  const dept = (e) => S.deptOf(e);

  // Folgas já marcadas em cada dia da semana: no total da empresa e por departamento.
  // Funcionários que serão refeitos (overwrite) não entram; eles são somados conforme são gerados.
  function weekCounts(monday, peers, regenIds, overwrite) {
    const total = [0, 0, 0, 0, 0, 0, 0];
    const depto = new Map();
    const keys = [0, 1, 2, 3, 4, 5, 6].map((i) => U.toKey(U.addDays(monday, i)));
    peers.forEach((p) => {
      if (!depto.has(dept(p))) depto.set(dept(p), [0, 0, 0, 0, 0, 0, 0]);
      if (overwrite && regenIds.has(p.id)) return;
      const arr = depto.get(dept(p));
      keys.forEach((k, i) => { if (S.getDay(p.id, k) === 'F') { total[i]++; arr[i]++; } });
    });
    return { total, depto };
  }

  // Quantas folgas a semana iniciada em `monday` precisa ter: 2 da jornada e mais 1 de compensação
  // quando o domingo anterior foi trabalhado. `prever`: domingo anterior ainda sem escala segue a regra.
  function folgasDaSemana(emp, monday, prever) {
    const prevSunday = U.addDays(monday, -1);
    const v = S.getDay(emp.id, U.toKey(prevSunday));
    const trabalhou = v === 'T' || (prever && v === null && !sundayShouldBeOff(emp, prevSunday));
    return FOLGAS_SEMANA + (trabalhou ? 1 : 0);
  }

  // Decide os domingos da semana. Mulheres alternam. Homens folgam obrigatoriamente depois de
  // 2 domingos trabalhados e, quando podem escolher, antecipam a folga para o domingo em que
  // o departamento tem menos gente de folga — assim os domingos ficam equilibrados.
  function planSundays(order, monday, peers, overwrite, regenIds) {
    const sunday = U.addDays(monday, 6);
    const key = U.toKey(sunday);
    const nextKey = U.toKey(U.addDays(sunday, 7));
    const nextMondayKey = U.toKey(U.addDays(monday, 7));
    const planned = new Map();
    const flexible = [];
    // O próximo domingo também será refeito nesta geração (ou ainda não existe)?
    const nextOpen = (p) => {
      const v = S.getDay(p.id, nextKey);
      return v === null || (overwrite && regenIds.has(p.id) && !isAbsence(v));
    };

    order.forEach((emp) => {
      const v = S.getDay(emp.id, key);
      if (v !== null && (isAbsence(v) || !overwrite)) return;
      if (emp.sexo === 'F') { planned.set(emp.id, sundayShouldBeOff(emp, sunday) ? 'F' : 'T'); return; }
      const before = workedSundaysBefore(emp, sunday);
      const after = nextOpen(emp) ? 0 : workedSundaysAfter(emp, sunday);
      if (sundayShouldBeOff(emp, sunday) || before.count + 1 + after > SUNDAY_LIMIT.M) {
        planned.set(emp.id, 'F');
        return;
      }
      planned.set(emp.id, 'T');
      if (before.known && before.count === 1 && nextOpen(emp) && S.getDay(emp.id, nextMondayKey) !== 'F') {
        flexible.push(emp);
      }
    });
    if (!flexible.length) return planned;

    // Folgas por departamento neste domingo e estimativa para o próximo.
    const off = new Map(), offNext = new Map();
    const add = (m, c, n) => m.set(c, (m.get(c) || 0) + n);
    peers.forEach((p) => {
      const v = planned.has(p.id) ? planned.get(p.id) : S.getDay(p.id, key);
      if (v === 'F') add(off, dept(p), 1);
      let nextOff;
      if (!nextOpen(p)) nextOff = S.getDay(p.id, nextKey) === 'F';
      else if (v !== 'T') nextOff = false;
      else nextOff = p.sexo === 'F' || workedSundaysBefore(p, sunday).count + 1 >= SUNDAY_LIMIT.M;
      if (nextOff) add(offNext, dept(p), 1);
    });
    flexible.forEach((emp) => {
      const a = off.get(dept(emp)) || 0;
      const b = offNext.get(dept(emp)) || 0;
      // Folgar agora tira a folga obrigatória do próximo domingo: (a + 1, b - 1) contra (a, b).
      if (Math.max(a + 1, b - 1) < Math.max(a, b)) {
        planned.set(emp.id, 'F');
        off.set(dept(emp), a + 1);
        offNext.set(dept(emp), b - 1);
      }
    });
    return planned;
  }

  // O que vem antes e depois da semana e afeta as regras: dias de trabalho seguidos que chegam
  // e que continuam depois, e folga no domingo anterior ou na segunda seguinte.
  function weekContext(emp, monday) {
    // O dia anterior é o domingo da semana passada; se ainda não foi gerado, usa o que a regra prevê.
    const prevSunday = U.addDays(monday, -1);
    const prevValue = S.getDay(emp.id, U.toKey(prevSunday));
    return {
      carry: streakBefore(emp, monday),
      carryAfter: streakFrom(emp, U.addDays(monday, 7)),
      prevDayOff: prevValue === 'F' || (prevValue === null && sundayShouldBeOff(emp, prevSunday)),
      nextDayOff: S.getDay(emp.id, U.toKey(U.addDays(monday, 7))) === 'F'
    };
  }

  // Quantas regras obrigatórias a semana quebra: mais de 6 dias de trabalho seguidos e folgas seguidas.
  function hardViolations(week, ctx) {
    let streak = ctx.carry, maxStreak = ctx.carry;
    week.forEach((v) => {
      streak = v === 'T' ? streak + 1 : 0;
      if (streak > maxStreak) maxStreak = streak;
    });
    // Se a semana seguinte já existe, a sequência de trabalho continua nela.
    if (streak + ctx.carryAfter > maxStreak) maxStreak = streak + ctx.carryAfter;
    // Folgas em dias seguidos, contando o domingo anterior e a segunda seguinte.
    let adjacent = 0;
    week.forEach((v, i) => {
      if (v === 'F' && (i === 0 ? ctx.prevDayOff : week[i - 1] === 'F')) adjacent++;
    });
    if (week[6] === 'F' && ctx.nextDayOff) adjacent++;
    return (maxStreak > MAX_STREAK ? 1 : 0) + adjacent;
  }

  // Gera a semana iniciada em `monday` para o funcionário.
  // overwrite=false: só preenche dias vazios. overwrite=true: refaz T/F (mantém férias/afastamentos).
  // Retorna os índices dos dias (0 = segunda) que foram gerados.
  function generateWeek(emp, monday, overwrite, sundayPlan, counts) {
    const days = [];
    for (let i = 0; i < 7; i++) days.push(U.addDays(monday, i));
    const keys = days.map(U.toKey);
    const current = keys.map((k) => S.getDay(emp.id, k));
    const fixed = current.map((v) => v !== null && (isAbsence(v) || !overwrite));

    if (fixed.every(Boolean)) return [];

    const plan = current.map((v, i) => (fixed[i] ? v : null));

    // Domingo segue o revezamento por sexo (decidido para a semana toda em planSundays).
    if (!fixed[6]) plan[6] = sundayPlan || (sundayShouldBeOff(emp, days[6]) ? 'F' : 'T');

    const folgasJa = plan.filter((v) => v === 'F').length;
    const needed = Math.max(0, folgasDaSemana(emp, monday, true) - folgasJa);
    const free = [];
    for (let i = 0; i < 6; i++) if (!fixed[i]) free.push(i);

    const ctx = weekContext(emp, monday);
    const wk = U.weekIndex(monday);
    // Peso de cada dia: colegas do mesmo departamento de folga (principal) e total da empresa.
    // Repetir o dia de folga da semana anterior custa um pouco, para o rodízio variar.
    const deptCount = counts.depto.get(dept(emp));
    // Limite de pessoas do departamento de folga no mesmo dia (definido pelo gerente). Só é
    // ultrapassado quando não há outra combinação que respeite as regras obrigatórias.
    const limite = S.limiteFolgas(dept(emp));
    const load = [0, 1, 2, 3, 4, 5].map((i) => {
      const repete = S.getDay(emp.id, U.toKey(U.addDays(monday, i - 7))) === 'F' ? 0.6 : 0;
      return deptCount[i] + counts.total[i] * 0.35 + repete;
    });

    let best = null;
    combinations(free, Math.min(needed, free.length)).forEach((combo) => {
      const trial = plan.slice();
      free.forEach((i) => { trial[i] = combo.includes(i) ? 'F' : 'T'; });
      // Regras obrigatórias pesam muito; depois equilibra folgas entre colegas do mesmo departamento;
      // o desempate rotativo evita que todos folguem sempre no mesmo dia.
      let score = hardViolations(trial, ctx) * 1000;
      combo.forEach((i) => {
        score += load[i] + (((i + wk + (emp.offset || 0)) % 6) * 0.01);
        if (limite && deptCount[i] >= limite) score += 500;
      });
      if (!best || score < best.score) best = { score, trial };
    });

    const result = best ? best.trial : plan.map((v) => v || 'T');
    const generated = [];
    keys.forEach((k, i) => {
      if (fixed[i]) return;
      S.setDay(emp.id, k, result[i], true);
      generated.push(i);
      if (result[i] === 'F') { counts.total[i]++; deptCount[i]++; }
    });
    return generated;
  }

  // Depois de gerar a semana, tira gente dos dias em que o departamento passou do limite de folgas:
  // muda a folga de dia (de segunda a sábado) quando isso não quebra nenhuma regra obrigatória.
  // Domingos seguem o revezamento por sexo e não são mexidos.
  function enforceDayLimit(order, monday, generated, counts) {
    const keys = [0, 1, 2, 3, 4, 5, 6].map((i) => U.toKey(U.addDays(monday, i)));
    counts.depto.forEach((deptCount, d) => {
      const limite = S.limiteFolgas(d);
      if (!limite) return;
      const doDepto = order.filter((e) => dept(e) === d);
      for (let from = 0; from < 6; from++) {
        for (const emp of doDepto) {
          if (deptCount[from] <= limite) break;
          const gen = generated.get(emp.id);
          if (!gen || !gen.includes(from) || S.getDay(emp.id, keys[from]) !== 'F') continue;
          const week = keys.map((k) => S.getDay(emp.id, k));
          const ctx = weekContext(emp, monday);
          let best = null;
          for (let to = 0; to < 6; to++) {
            if (to === from || !gen.includes(to) || week[to] !== 'T' || deptCount[to] >= limite) continue;
            const trial = week.slice();
            trial[from] = 'T';
            trial[to] = 'F';
            if (hardViolations(trial, ctx)) continue;
            const score = deptCount[to] + counts.total[to] * 0.35;
            if (!best || score < best.score) best = { score, to };
          }
          if (!best) continue;
          S.setDay(emp.id, keys[from], 'T', true);
          S.setDay(emp.id, keys[best.to], 'F', true);
          counts.total[from]--; deptCount[from]--;
          counts.total[best.to]++; deptCount[best.to]++;
        }
      }
    });
  }

  // Gera as semanas entre duas datas (inclusive) para os funcionários informados.
  // Cada semana é decidida em conjunto: primeiro os domingos, depois os dias de semana,
  // numa ordem que gira a cada semana para ninguém ficar sempre com a primeira escolha.
  function generateRange(emps, from, to, overwrite) {
    const peers = S.employees();
    const regenIds = new Set(emps.map((e) => e.id));
    let monday = U.mondayOf(from);
    const lastMonday = U.mondayOf(to);
    while (monday <= lastMonday) {
      const shift = emps.length ? ((U.weekIndex(monday) * 7) % emps.length + emps.length) % emps.length : 0;
      const order = emps.slice(shift).concat(emps.slice(0, shift));
      const counts = weekCounts(monday, peers, regenIds, overwrite);
      const sundays = planSundays(order, monday, peers, overwrite, regenIds);
      const generated = new Map();
      order.forEach((emp) => generated.set(emp.id, generateWeek(emp, monday, overwrite, sundays.get(emp.id), counts)));
      enforceDayLimit(order, monday, generated, counts);
      monday = U.addDays(monday, 7);
    }
    // Com os dias de trabalho definidos, escolhe o horário (abertura, fechamento...) de cada um.
    assignShifts(emps, U.mondayOf(from), U.addDays(lastMonday, 6), overwrite);
    S.save();
  }

  // Garante que todos os meses do ano estejam preenchidos (sem sobrescrever ajustes).
  const ensured = new Set();
  function ensureYear(year) {
    const emps = S.employees();
    const sig = year + ':' + emps.map((e) => e.id).join(',');
    if (ensured.has(sig)) return;
    // Gera os anos em ordem a partir do ano atual, para o ciclo de domingos continuar entre anos.
    const start = Math.min(year, new Date().getFullYear());
    for (let y = start; y <= year; y++) {
      generateRange(emps, new Date(y, 0, 1), new Date(y, 11, 31), false);
    }
    ensured.add(sig);
  }

  function resetEnsured() { ensured.clear(); }

  // ---------- Validação ----------
  function cellId(empId, key) { return empId + '|' + key; }

  function validateMonth(year, month, emps) {
    return validateRange(new Date(year, month, 1), new Date(year, month, U.daysInMonth(year, month)), emps);
  }

  // Valida as regras para os dias entre `monthStart` e `monthEnd` (inclusive; pode ser uma semana).
  function validateRange(monthStart, monthEnd, emps) {
    const cells = new Map();   // cellId -> [mensagens]
    const weekWarn = new Set(); // cellId de dias em semanas fora do 5x2
    const alerts = [];
    const inMonth = (d) => d >= monthStart && d <= monthEnd;
    const from = U.addDays(U.mondayOf(monthStart), -28);
    const to = U.addDays(U.mondayOf(monthEnd), 6);

    function flag(emp, d, msg) {
      const id = cellId(emp.id, U.toKey(d));
      if (!cells.has(id)) cells.set(id, []);
      cells.get(id).push(msg);
    }

    emps.forEach((emp) => {
      const limit = sundayLimit(emp);

      // Domingos seguidos trabalhados.
      let sundays = 0;
      for (let d = U.addDays(from, 6); d <= to; d = U.addDays(d, 7)) {
        const v = S.getDay(emp.id, U.toKey(d));
        sundays = v === 'T' ? sundays + 1 : 0;
        if (sundays > limit && inMonth(d)) {
          const msg = sundays + ' domingos seguidos trabalhados (máximo ' + limit + ' para ' +
            (emp.sexo === 'M' ? 'homens' : 'mulheres') + ')';
          flag(emp, d, msg);
          alerts.push({ emp, key: U.toKey(d), type: 'domingo', msg });
        }
        if (v === 'F' && inMonth(d) && !sundayOffAllowed(emp, d)) {
          const msg = 'folga no domingo ' + U.formatDateBR(U.toKey(d)).slice(0, 5) +
            ' fora da alternância (mulheres: 1 domingo trabalhado e 1 de folga)';
          flag(emp, d, 'Folga de domingo fora do revezamento');
          alerts.push({ emp, key: U.toKey(d), type: 'domingo', msg });
        }
      }

      // Dias de trabalho consecutivos.
      let streak = 0, alerted = false;
      for (let d = from; d <= to; d = U.addDays(d, 1)) {
        const v = S.getDay(emp.id, U.toKey(d));
        if (v === 'T') streak++; else { streak = 0; alerted = false; }
        if (streak > MAX_STREAK && inMonth(d)) {
          flag(emp, d, streak + 'º dia de trabalho seguido (máximo ' + MAX_STREAK + ')');
          if (!alerted) {
            alerts.push({ emp, key: U.toKey(d), type: 'sequencia', msg: 'mais de ' + MAX_STREAK + ' dias de trabalho seguidos' });
            alerted = true;
          }
        }
      }

      // Folgas em dias seguidos (inclui a virada do mês e da semana).
      let prev = S.getDay(emp.id, U.toKey(U.addDays(monthStart, -1)));
      for (let d = monthStart; d <= monthEnd; d = U.addDays(d, 1)) {
        const v = S.getDay(emp.id, U.toKey(d));
        if (v === 'F' && prev === 'F') {
          const ontem = U.addDays(d, -1);
          const msg = 'folgas seguidas em ' + U.formatDateBR(U.toKey(ontem)).slice(0, 5) + ' e ' +
            U.formatDateBR(U.toKey(d)).slice(0, 5);
          flag(emp, ontem, 'Folga seguida de outra folga');
          flag(emp, d, 'Folga seguida de outra folga');
          alerts.push({ emp, key: U.toKey(ontem), type: 'seguidas', msg });
        }
        prev = v;
      }

      // Descanso de 11h entre turnos e fechamento seguido de abertura.
      let ontem = workTimes(emp, U.toKey(U.addDays(monthStart, -1)));
      for (let d = monthStart; d <= monthEnd; d = U.addDays(d, 1)) {
        const hoje = workTimes(emp, U.toKey(d));
        const problema = restProblem(ontem, hoje);
        if (problema) {
          flag(emp, d, 'Descanso: ' + problema);
          alerts.push({
            emp, key: U.toKey(d), type: 'descanso',
            msg: 'de ' + U.formatDateBR(U.toKey(U.addDays(d, -1))).slice(0, 5) + ' para ' +
              U.formatDateBR(U.toKey(d)).slice(0, 5) + ': ' + problema
          });
        }
        ontem = hoje;
      }

      // Folgas da semana: 2 da jornada e mais 1 quando o domingo anterior foi trabalhado.
      for (let m = U.mondayOf(monthStart); m <= monthEnd; m = U.addDays(m, 7)) {
        const vals = [];
        for (let i = 0; i < 7; i++) vals.push(S.getDay(emp.id, U.toKey(U.addDays(m, i))));
        if (vals.some((v) => v === null || isAbsence(v))) continue;
        const domingoAnterior = U.addDays(m, -1);
        if (S.getDay(emp.id, U.toKey(domingoAnterior)) === null) continue; // ainda sem escala: não dá para saber
        const certo = folgasDaSemana(emp, m, false);
        const folgas = vals.filter((v) => v === 'F').length;
        if (folgas !== certo) {
          const sun = U.addDays(m, 6);
          const horas = vals.filter((v) => v === 'T').length * JORNADA_DIARIA_MIN;
          const motivo = certo > FOLGAS_SEMANA
            ? ' (o certo são ' + certo + ' folgas: 2 da jornada e 1 pelo domingo ' +
              U.formatDateBR(U.toKey(domingoAnterior)).slice(0, 5) + ' trabalhado)'
            : ' (o certo são ' + certo + ' folgas e ' + formatHoras(JORNADA_SEMANAL_MIN) + ')';
          alerts.push({
            emp, key: U.toKey(m), type: 'semana',
            msg: 'semana de ' + U.formatDateBR(U.toKey(m)).slice(0, 5) + ' a ' +
              U.formatDateBR(U.toKey(sun)).slice(0, 5) + ' com ' + folgas + ' ' + U.plural(folgas, 'folga', 'folgas') +
              ' e ' + formatHoras(horas) + ' de trabalho' + motivo
          });
          for (let i = 0; i < 7; i++) weekWarn.add(cellId(emp.id, U.toKey(U.addDays(m, i))));
        }
      }
    });

    // Limite de pessoas de folga no mesmo dia, por departamento: conta o departamento inteiro,
    // mesmo com a busca filtrando.
    const overDays = new Map(); // dia -> [{ dept, n, limite }] dos departamentos acima do limite
    const todos = S.employees();
    const deptos = S.departamentos().filter((d) => S.limiteFolgas(d));
    if (deptos.length) {
      const dayAlerts = [];
      for (let d = monthStart; d <= monthEnd; d = U.addDays(d, 1)) {
        const key = U.toKey(d);
        deptos.forEach((dp) => {
          const limite = S.limiteFolgas(dp);
          const n = todos.filter((e) => dept(e) === dp && S.getDay(e.id, key) === 'F').length;
          if (n <= limite) return;
          if (!overDays.has(key)) overDays.set(key, []);
          overDays.get(key).push({ dept: dp, n, limite });
          dayAlerts.push({
            emp: null, key, type: 'limite',
            msg: U.DIAS_NOMES[d.getDay()] + ', ' + U.formatDateBR(key).slice(0, 5) + ': ' + n +
              ' pessoas de ' + dp + ' de folga (o limite do departamento é ' + limite + ' por dia)'
          });
        });
      }
      alerts.unshift(...dayAlerts);
    }

    return { cells, weekWarn, alerts, overDays };
  }

  // Folga de compensação: na semana depois de um domingo trabalhado, a primeira folga de
  // segunda a sábado é a do domingo. Retorna true para esse dia.
  function isCompFolga(emp, key) {
    const day = U.fromKey(key);
    if (day.getDay() === 0 || S.getDay(emp.id, key) !== 'F') return false;
    const monday = U.mondayOf(day);
    if (S.getDay(emp.id, U.toKey(U.addDays(monday, -1))) !== 'T') return false;
    for (let d = monday; d < day; d = U.addDays(d, 1)) {
      if (S.getDay(emp.id, U.toKey(d)) === 'F') return false;
    }
    return true;
  }

  // Conta violações do revezamento de domingos numa janela ao redor da data:
  // `excesso` = domingos trabalhados além do limite; `foraDoRevezamento` = folgas antes da hora.
  function sundayViolationsAround(emp, day) {
    const limit = sundayLimit(emp);
    const sunday = U.addDays(U.mondayOf(day), 6);
    let excesso = 0, foraDoRevezamento = 0, run = 0;
    for (let i = -4; i <= 4; i++) {
      const d = U.addDays(sunday, i * 7);
      const v = S.getDay(emp.id, U.toKey(d));
      run = v === 'T' ? run + 1 : 0;
      if (run > limit) excesso++;
      if (v === 'F' && !sundayOffAllowed(emp, d)) foraDoRevezamento++;
    }
    return { excesso, foraDoRevezamento };
  }

  // Retorna mensagem de erro se a alteração quebrar uma regra obrigatória; caso contrário null.
  function checkChange(emp, key, newValue) {
    const day = U.fromKey(key);
    // Férias e afastamento podem cair em qualquer domingo; trabalho e folga seguem o revezamento.
    if (day.getDay() === 0 && (newValue === 'T' || newValue === 'F')) {
      const old = S.getDay(emp.id, key);
      const before = sundayViolationsAround(emp, day);
      S.setDay(emp.id, key, newValue, true);
      const after = sundayViolationsAround(emp, day);
      S.setDay(emp.id, key, old, true);
      if (after.excesso > before.excesso) {
        return revezamentoTexto(emp) + ' Este domingo precisa ser de folga.';
      }
      if (after.foraDoRevezamento > before.foraDoRevezamento) {
        return revezamentoTexto(emp) + ' Este domingo precisa ser trabalhado.';
      }
    }
    if (newValue === 'F') {
      const antes = S.getDay(emp.id, U.toKey(U.addDays(day, -1))) === 'F';
      const depois = S.getDay(emp.id, U.toKey(U.addDays(day, 1))) === 'F';
      if (antes || depois) {
        return 'Não é permitido colocar duas folgas seguidas. ' +
          'Para mudar uma folga de dia, primeiro volte a folga atual para trabalho.';
      }
    }
    return null;
  }

  // ---------- Tipos de escala (horários) ----------
  function toMin(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  // Calcula a jornada diária de um tipo de escala. Retorna { erro } ou { trabalho, intervalo, avisos }.
  function shiftInfo(s) {
    const e = toMin(s.entrada), sa = toMin(s.saidaAlmoco), va = toMin(s.voltaAlmoco), f = toMin(s.saida);
    if ([e, sa, va, f].some((v) => v === null)) return { erro: 'Preencha os quatro horários.' };
    if (!(e < sa && sa < va && va < f)) {
      return { erro: 'Os horários precisam estar em ordem: entrada, saída para almoço, volta do almoço e encerramento.' };
    }
    const trabalho = (sa - e) + (f - va);
    const intervalo = va - sa;
    const avisos = [];
    if (trabalho !== JORNADA_DIARIA_MIN) {
      avisos.push('São ' + formatHoras(trabalho) + ' por dia, ' + formatHoras(trabalho * DIAS_TRABALHO) +
        ' na semana. Para 42h semanais o dia precisa ter ' + formatHoras(JORNADA_DIARIA_MIN) + '.');
    }
    if (intervalo < 60) avisos.push('O intervalo de almoço tem menos de 1 hora.');
    if (intervalo > 120) avisos.push('O intervalo de almoço passa de 2 horas.');
    return { trabalho, intervalo, avisos };
  }

  // Minutos de trabalho de uma escala de horário (sem escala, 8h24).
  function shiftMinutes(shift) {
    const info = shift ? shiftInfo(shift) : null;
    return info && !info.erro ? info.trabalho : JORNADA_DIARIA_MIN;
  }

  // ---------- Escala de horário de cada dia: rodízio de abertura e fechamento ----------
  const DESCANSO_MIN = 11 * 60; // descanso mínimo entre o fim de um turno e o início do próximo

  // Escalas de horário sem erro, em ordem de entrada.
  function validShifts() {
    return S.shifts().filter((s) => !shiftInfo(s).erro)
      .sort((a, b) => toMin(a.entrada) - toMin(b.entrada) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function fixedShift(emp) {
    return emp.escalaFixa && emp.escalaId ? S.getShift(emp.escalaId) : null;
  }

  // Escala de horário de um dia: a fixa do funcionário ou a que o rodízio escolheu para o dia.
  function shiftForDay(emp, key) {
    const fixa = fixedShift(emp);
    if (fixa) return fixa;
    const id = S.getDayShift(emp.id, key);
    return id ? S.getShift(id) : null;
  }

  // Problema de descanso entre o turno de um dia (a) e o do dia seguinte (b), ou null.
  // a e b têm entrada, saida e, quando vierem de uma escala, id, abertura e fechamento.
  function restProblem(a, b) {
    if (!a || !b) return null;
    if (a.fechamento && b.abertura && a.id !== b.id) {
      return 'fez o fechamento da loja e faria a abertura no dia seguinte';
    }
    const fim = toMin(a.saida), ini = toMin(b.entrada);
    if (fim === null || ini === null) return null;
    const descanso = 24 * 60 - fim + ini;
    if (descanso < DESCANSO_MIN) return 'só ' + formatHoras(descanso) + ' de descanso entre os turnos (mínimo 11h)';
    return null;
  }

  // Horários efetivos de um dia, só quando o dia é de trabalho.
  function workTimes(emp, key) {
    return S.getDay(emp.id, key) === 'T' ? dayTimes(emp, key) : null;
  }

  // Problema de descanso de um dia com o anterior e com o seguinte, usando `t` como horários do dia.
  function restIssueAround(emp, key, t) {
    const day = U.fromKey(key);
    const antes = restProblem(workTimes(emp, U.toKey(U.addDays(day, -1))), t);
    if (antes) return 'Em relação ao dia anterior: ' + antes + '.';
    const depois = restProblem(t, workTimes(emp, U.toKey(U.addDays(day, 1))));
    if (depois) return 'Em relação ao dia seguinte: ' + depois + '.';
    return null;
  }

  function shiftTimes(s) {
    return { id: s.id, entrada: s.entrada, saida: s.saida, abertura: !!s.abertura, fechamento: !!s.fechamento };
  }

  // Escolhe a escala de horário de cada dia de trabalho entre `from` e `to`, para quem faz rodízio.
  // Em cada dia, cada departamento fica dividido entre os horários (abertura, fechamento e intermediários),
  // e cada pessoa alterna entre eles ao longo das semanas, sem nunca ter menos de 11h de descanso
  // nem abrir a loja no dia seguinte a um fechamento. overwrite=false: só preenche dias sem horário.
  function assignShifts(emps, from, to, overwrite) {
    const shifts = validShifts();
    if (!shifts.length) return;
    const ids = new Set(shifts.map((s) => s.id));
    const peers = S.employees();
    const regen = new Set(emps.filter((e) => !fixedShift(e)).map((e) => e.id));
    const rot = peers.filter((e) => regen.has(e.id));
    if (!rot.length) return;
    const valido = (id) => id && ids.has(id);

    // Uso de cada turno por pessoa nas 4 semanas anteriores: quem abriu mais tende a fechar, e vice-versa.
    const uso = new Map(rot.map((e) => [e.id, new Map(shifts.map((s) => [s.id, 0]))]));
    for (let d = U.addDays(from, -28); d < from; d = U.addDays(d, 1)) {
      const k = U.toKey(d);
      rot.forEach((e) => {
        const id = S.getDayShift(e.id, k);
        if (S.getDay(e.id, k) === 'T' && valido(id)) uso.get(e.id).set(id, uso.get(e.id).get(id) + 1);
      });
    }

    for (let d = from, n = 0; d <= to; d = U.addDays(d, 1), n++) {
      const key = U.toKey(d);
      const prevKey = U.toKey(U.addDays(d, -1));
      const nextKey = U.toKey(U.addDays(d, 1));
      const ultimo = U.toKey(to) === key;

      // Quem já tem horário neste dia e não vai mudar conta na cobertura do departamento.
      const cobertura = new Map();
      const cob = (c) => { if (!cobertura.has(c)) cobertura.set(c, new Map(shifts.map((s) => [s.id, 0]))); return cobertura.get(c); };
      const pendentes = [];
      peers.forEach((e) => {
        const v = S.getDay(e.id, key);
        if (regen.has(e.id) && v !== 'T') { if (overwrite) S.setDayShift(e.id, key, null, true); return; }
        if (v !== 'T') return;
        const atual = regen.has(e.id) ? S.getDayShift(e.id, key) : (fixedShift(e) || {}).id || S.getDayShift(e.id, key);
        if (regen.has(e.id) && (overwrite || !valido(atual))) { pendentes.push(e); return; }
        if (valido(atual)) cob(dept(e)).set(atual, cob(dept(e)).get(atual) + 1);
      });
      if (!pendentes.length) continue;

      // Turnos possíveis para cada pessoa, respeitando o descanso com o dia anterior e,
      // quando o dia seguinte já tem horário que não será refeito, com ele também.
      const opcoes = new Map(pendentes.map((e) => {
        const antes = workTimes(e, prevKey);
        const checaDepois = !overwrite || ultimo;
        const depois = checaDepois ? workTimes(e, nextKey) : null;
        const ok = shifts.filter((s) => !restProblem(antes, shiftTimes(s)) && !restProblem(shiftTimes(s), depois));
        return [e.id, ok.length ? ok : shifts];
      }));
      // A cada passo escolhe o melhor par (pessoa, turno): primeiro a cobertura do departamento no dia
      // (abertura e fechamento antes dos intermediários), depois quem fez menos aquele turno
      // nas últimas semanas, para cada um alternar entre abrir e fechar a loja.
      const ontem = new Map(pendentes.map((e) => [e.id, S.getDay(e.id, prevKey) === 'T' ? S.getDayShift(e.id, prevKey) : null]));
      const restantes = pendentes.slice();
      while (restantes.length) {
        let best = null;
        restantes.forEach((e, ei) => {
          const c = cob(dept(e));
          const u = uso.get(e.id);
          opcoes.get(e.id).forEach((s, i) => {
            const intermediario = !s.abertura && !s.fechamento ? 50 : 0;
            // Repetir o turno de ontem custa um pouco menos, para não trocar todo dia sem necessidade.
            const score = c.get(s.id) * 100 + intermediario + u.get(s.id) + (s.id === ontem.get(e.id) ? -0.5 : 0) +
              (((i + n + (e.offset || 0)) % shifts.length) * 0.01) + (((ei + n) % restantes.length) * 0.001);
            if (!best || score < best.score) best = { score, e, s, ei };
          });
        });
        const { e, s, ei } = best;
        S.setDayShift(e.id, key, s.id, true);
        cob(dept(e)).set(s.id, cob(dept(e)).get(s.id) + 1);
        uso.get(e.id).set(s.id, uso.get(e.id).get(s.id) + 1);
        restantes.splice(ei, 1);
      }
    }
    S.save();
  }

  // Preenche o horário dos dias de trabalho que ainda não têm (ex.: folga trocada por trabalho).
  function fillShifts(from, to) {
    assignShifts(S.employees(), from, to, false);
  }

  // Os quatro horários de um dia de trabalho, na ordem em que acontecem.
  const HORARIOS = ['entrada', 'saidaAlmoco', 'voltaAlmoco', 'saida'];

  // Horários de um dia de trabalho, com a escala do dia (id, nome, abertura, fechamento).
  // No modo manual, valem os horários ajustados naquele dia (custom = true), se houver.
  // Ajuste sem algum dos horários (ex.: salvo antes de existir o almoço por dia) completa com a escala.
  function dayTimes(emp, key) {
    const shift = shiftForDay(emp, key);
    const base = shift
      ? { custom: false, id: shift.id, nome: shift.nome, abertura: !!shift.abertura, fechamento: !!shift.fechamento }
      : null;
    if (base) HORARIOS.forEach((c) => { base[c] = shift[c]; });
    if (S.config().horarios !== 'manual') return base;
    const t = S.getTime(emp.id, key);
    if (!t) return base;
    const out = Object.assign({}, base || {}, { custom: true });
    HORARIOS.forEach((c) => { out[c] = t[c] !== undefined ? t[c] : (base ? base[c] : ''); });
    // O almoço da escala pode não caber entre a entrada e o encerramento ajustados: fica em branco.
    if (checkTimes(out)) {
      HORARIOS.forEach((c) => { if (t[c] === undefined) out[c] = ''; });
    }
    return out;
  }

  // Erro nos horários digitados na grade, ou null. Os preenchidos precisam estar em ordem.
  function checkTimes(t) {
    const mins = HORARIOS.map((c) => toMin(t[c])).filter((v) => v !== null);
    for (let i = 1; i < mins.length; i++) {
      if (mins[i] <= mins[i - 1]) {
        return 'Os horários precisam estar em ordem: entrada, saída para almoço, volta do almoço e encerramento ' +
          '(turnos que passam da meia-noite ainda não são aceitos).';
      }
    }
    return null;
  }

  // Minutos trabalhados num dia: manhã (entrada até o almoço) mais tarde (volta até o encerramento).
  // Sem os horários do almoço, desconta o almoço da escala (ou 1h sem escala).
  function dayMinutes(emp, key) {
    const shift = shiftForDay(emp, key);
    const t = dayTimes(emp, key);
    if (!t || !t.custom) return shiftMinutes(shift);
    const [e, sa, va, s] = HORARIOS.map((c) => toMin(t[c]));
    if (e === null || s === null || s <= e) return shiftMinutes(shift);
    if (sa !== null && va !== null && e < sa && sa < va && va < s) return (sa - e) + (s - va);
    const info = shift ? shiftInfo(shift) : null;
    const almoco = info && !info.erro ? info.intervalo : 60;
    return Math.max(0, s - e - almoco);
  }

  function periodStats(emp, start, end) {
    let folgas = 0, trab = 0, minutos = 0;
    for (let d = start; d <= end; d = U.addDays(d, 1)) {
      const key = U.toKey(d);
      const v = S.getDay(emp.id, key);
      if (v === 'F') folgas++;
      if (v === 'T') { trab++; minutos += dayMinutes(emp, key); }
    }
    return { folgas, trab, horas: formatHoras(minutos) };
  }

  App.scale = {
    STATUS, SUNDAY_LIMIT, MAX_STREAK,
    JORNADA_SEMANAL: formatHoras(JORNADA_SEMANAL_MIN),
    JORNADA_DIARIA: formatHoras(JORNADA_DIARIA_MIN),
    generateRange, ensureYear, resetEnsured,
    validateMonth, validateRange, checkChange, periodStats, cellId, formatHoras,
    shiftInfo, dayTimes, checkTimes, HORARIOS,
    validShifts, shiftForDay, fixedShift, assignShifts, fillShifts, restIssueAround, DESCANSO: formatHoras(DESCANSO_MIN),
    isCompFolga
  };
})(window.App);
