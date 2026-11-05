/* Impressão da escala mensal: todos os funcionários da empresa aberta, um dia por coluna. */
(function (App) {
  const U = App.util;
  const S = App.store;
  const R = App.scale;
  const esc = U.escapeHtml;

  const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const SIGLAS = { T: 'T', F: 'F', FE: 'FE', AT: 'AT' };

  function root() { return document.getElementById('print-root'); }

  function horas(s) {
    return `${s.entrada}–${s.saidaAlmoco} / ${s.voltaAlmoco}–${s.saida}`;
  }

  function tipo(s) {
    if (s.abertura && s.fechamento) return 'abertura e fechamento';
    if (s.abertura) return 'abertura';
    if (s.fechamento) return 'fechamento';
    return 'intermediário';
  }

  // Escala fixa do funcionário ou rodízio.
  function horarioEscala(emp) {
    const s = R.fixedShift(emp);
    if (!s) return { nome: 'Rodízio', horas: 'abertura e fechamento' };
    return { nome: 'Fixo: ' + s.nome, horas: horas(s) };
  }

  // Monta a folha do mês (month: 0 a 11) dentro de #print-root.
  function build(year, month) {
    R.ensureYear(year);
    const emps = S.employees().slice().sort((a, b) =>
      S.deptOf(a).localeCompare(S.deptOf(b), 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
    const n = U.daysInMonth(year, month);
    const days = [];
    for (let d = 1; d <= n; d++) days.push(new Date(year, month, d));
    const empresa = App.auth.getEmpresa(App.empresaAtiva);
    const manual = S.config().horarios === 'manual';
    const ajustes = []; // dias com horário diferente da escala (modo manual)
    // Cada escala de horário vira um código curto na célula do dia (H1, H2...), explicado na legenda.
    R.fillShifts(days[0], days[days.length - 1]);
    const escalas = R.validShifts();
    const codigo = new Map(escalas.map((s, i) => [s.id, 'H' + (i + 1)]));

    const rows = emps.map((e) => {
      const h = horarioEscala(e);
      let folgas = 0, trabalhados = 0;
      const cells = days.map((d) => {
        const key = U.toKey(d);
        const v = S.getDay(e.id, key);
        if (v === 'F') folgas++;
        if (v === 'T') trabalhados++;
        let txt = v ? SIGLAS[v] : '';
        const cls = ['pm-d', 'v-' + (v || 'none')];
        if (v === 'F' && R.isCompFolga(e, key)) txt = 'FD';
        if (v === 'T') {
          const t = R.dayTimes(e, key);
          if (t && codigo.has(t.id)) {
            txt = codigo.get(t.id);
            if (t.abertura) cls.push('ab');
            if (t.fechamento) cls.push('fe');
          }
          if (manual && t && t.custom) {
            txt += '*';
            ajustes.push(`${e.nome}, ${U.formatDateBR(key).slice(0, 5)}: ${R.HORARIOS.map((c) => t[c] || '--:--').join(' ')}`);
          }
        }
        if (d.getDay() === 0) cls.push('sun');
        return `<td class="${cls.join(' ')}">${txt}</td>`;
      }).join('');
      return `<tr>
        <td class="pm-name"><strong>${esc(e.nome)}</strong><span>${esc(S.deptOf(e))}, ${esc(e.cargo)}</span></td>
        <td class="pm-shift"><strong>${esc(h.nome)}</strong><span>${esc(h.horas)}</span></td>
        ${cells}
        <td class="pm-total">${trabalhados}</td>
        <td class="pm-total">${folgas}</td>
      </tr>`;
    }).join('');

    root().innerHTML = `
      <div class="pm">
        <header class="pm-head">
          <div>
            <h1>Escala de trabalho de ${U.MESES[month].toLowerCase()} de ${year}</h1>
            <p>${empresa ? `${esc(empresa.razaoSocial)}, CNPJ ${U.formatCNPJ(empresa.cnpj)}` : ''}</p>
          </div>
          <p class="pm-meta">${emps.length} ${U.plural(emps.length, 'funcionário', 'funcionários')}<br>
            Impresso em ${U.formatDateBR(U.toKey(new Date()))}</p>
        </header>
        <table class="pm-table">
          <colgroup>
            <col class="c-name"><col class="c-shift">
            ${days.map(() => '<col class="c-day">').join('')}
            <col class="c-total"><col class="c-total">
          </colgroup>
          <thead>
            <tr>
              <th rowspan="2" class="pm-name">Funcionário</th>
              <th rowspan="2" class="pm-shift">Horário<span>rodízio ou escala fixa</span></th>
              ${days.map((d) => `<th class="pm-d ${d.getDay() === 0 ? 'sun' : ''}">${d.getDate()}</th>`).join('')}
              <th rowspan="2" class="pm-total">Dias trab.</th>
              <th rowspan="2" class="pm-total">Folgas</th>
            </tr>
            <tr>
              ${days.map((d) => `<th class="pm-d pm-dow ${d.getDay() === 0 ? 'sun' : ''}">${INICIAIS[d.getDay()]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="${n + 4}">Nenhum funcionário cadastrado.</td></tr>`}</tbody>
        </table>
        ${escalas.length ? `
        <ul class="pm-codes">
          ${escalas.map((s) => `<li class="${s.abertura ? 'ab' : ''} ${s.fechamento ? 'fe' : ''}"><strong>${codigo.get(s.id)}</strong>
            ${esc(s.nome)} (${tipo(s)}): ${horas(s)}</li>`).join('')}
        </ul>` : ''}
        <p class="pm-legend"><strong>F</strong> folga &nbsp; <strong>FD</strong> folga a mais pelo domingo trabalhado na semana anterior &nbsp; <strong>FE</strong> férias &nbsp; <strong>AT</strong> afastamento &nbsp;
          <strong>T</strong> trabalho sem horário definido &nbsp; Colunas destacadas: domingos. Quem fecha a loja não abre no dia seguinte (11h de descanso).
          ${ajustes.length ? ' &nbsp; <strong>*</strong> horário ajustado no dia (abaixo).' : ''}</p>
        ${ajustes.length ? `
        <div class="pm-adjust">
          <strong>Horários ajustados (entrada, saída para almoço, volta do almoço, encerramento)</strong>
          <ul>${ajustes.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>` : ''}
        <div class="pm-sign">
          <span>Responsável pela escala</span>
          <span>Data</span>
        </div>
      </div>`;
    document.body.classList.add('printing-month');
  }

  function clear() {
    document.body.classList.remove('printing-month');
    const el = root();
    if (el) el.innerHTML = '';
  }

  function printMonth(year, month) {
    build(year, month);
    window.print();
  }

  window.addEventListener('afterprint', clear);

  App.printView = { build, clear, printMonth };
})(window.App);
