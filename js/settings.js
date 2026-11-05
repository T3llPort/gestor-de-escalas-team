/* Tela de configurações: cadastro dos tipos de escala (horários de trabalho). */
(function (App) {
  const U = App.util;
  const S = App.store;
  const R = App.scale;
  const esc = U.escapeHtml;

  const CAMPOS = [
    { id: 'entrada', label: 'Entrada' },
    { id: 'saidaAlmoco', label: 'Saída para almoço' },
    { id: 'voltaAlmoco', label: 'Volta do almoço' },
    { id: 'saida', label: 'Encerramento' }
  ];

  let rootEl = null;

  function render(root) {
    rootEl = root;
    const list = S.shifts();
    const deptos = deptStats();

    root.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Configurações</h1>
          <p class="muted">Cadastre as escalas de horário da empresa e defina quantos funcionários podem folgar no mesmo dia.
            Na tela de escala, clique no nome de um funcionário para escolher a escala dele.</p>
        </div>
        <div class="actions">
          <button class="btn primary" id="btn-add-shift">Adicionar escala</button>
        </div>
      </div>

      <section class="card list-card">
        <div class="section-head">
          <h2>Escalas de horário</h2>
          <span class="muted">${list.length} ${U.plural(list.length, 'escala cadastrada', 'escalas cadastradas')}</span>
        </div>
        ${list.length ? `
        <div class="table-wrap">
          <table class="table shifts-table">
            <thead>
              <tr>
                <th>Escala</th>
                <th>Tipo</th>
                ${CAMPOS.map((c) => `<th>${c.label}</th>`).join('')}
                <th>Jornada diária</th>
                <th title="Funcionários com horário fixo nesta escala; os demais fazem rodízio">Fixos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map((s) => {
                const info = R.shiftInfo(s);
                const n = S.employeesInShift(s.id);
                return `<tr>
                  <td class="strong">${esc(s.nome)}</td>
                  <td><span class="shift-type ${s.abertura ? 't-ab' : ''} ${s.fechamento ? 't-fe' : ''}">${tipoTexto(s)}</span></td>
                  ${CAMPOS.map((c) => `<td class="mono">${esc(s[c.id])}</td>`).join('')}
                  <td class="mono">
                    ${info.erro ? '<span class="text-danger">Horários inválidos</span>' : R.formatHoras(info.trabalho)}
                    ${info.avisos && info.avisos.length ? `<span class="warn-dot" title="${esc(info.avisos.join(' '))}">!</span>` : ''}
                  </td>
                  <td>${n}</td>
                  <td class="row-actions">
                    <button class="link" data-edit="${s.id}">Editar</button>
                    <button class="link danger" data-del="${s.id}">Excluir</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : `
        <div class="empty">
          Nenhuma escala cadastrada ainda.<br>
          Use <strong>Adicionar escala</strong> e informe os horários de entrada, almoço e encerramento.
        </div>`}
      </section>

      <section class="card list-card">
        <div class="section-head">
          <h2>Folgas no mesmo dia, por departamento</h2>
        </div>
        <div class="rules-body">
          <p class="muted small">Quantos funcionários de cada departamento podem folgar no mesmo dia. Ao gerar ou regenerar a escala,
            as folgas de segunda a sábado não passam desse número; nos domingos vale o revezamento por sexo, mesmo que passe.
            Deixe vazio para não limitar. Depois de mudar, use <strong>Regenerar</strong> na tela de escala para reorganizar as semanas já montadas.</p>
        </div>
        ${deptos.length ? `
        <div class="table-wrap">
          <table class="table dept-limits">
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Funcionários</th>
                <th>Máximo de folgas no mesmo dia</th>
                <th>Mínimo possível</th>
              </tr>
            </thead>
            <tbody>
              ${deptos.map((d) => {
                const limite = S.limiteFolgas(d.nome);
                const baixo = limite && d.minimo && limite < d.minimo;
                return `<tr>
                  <td class="strong">${esc(d.nome)}</td>
                  <td>${d.pessoas}</td>
                  <td>
                    <input type="number" class="dept-limit" data-dept="${esc(d.nome)}" min="1" step="1" inputmode="numeric"
                      placeholder="Sem limite" value="${limite || ''}" aria-label="Máximo de folgas no mesmo dia em ${esc(d.nome)}">
                    ${baixo ? '<span class="warn-dot" title="Abaixo do mínimo possível: não cabem as folgas de todos">!</span>' : ''}
                  </td>
                  <td class="muted" title="Média de folgas de segunda a sábado nas próximas semanas">${d.minimo ? d.minimo + ' por dia' : ''}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : `
        <div class="empty">Cadastre funcionários com departamento para definir os limites.</div>`}
      </section>`;

    root.querySelectorAll('.dept-limit').forEach((i) => i.addEventListener('change', () => changeLimit(i.dataset.dept, i.value)));
    root.querySelector('#btn-add-shift').addEventListener('click', () => openForm(null));
    root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openForm(S.getShift(b.dataset.edit))));
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(S.getShift(b.dataset.del))));
  }

  // Departamentos com quantas pessoas têm e o menor limite que cabe: a média de folgas de segunda
  // a sábado nas próximas 8 semanas (2 por semana, mais a compensação de quem trabalhou no domingo).
  function deptStats() {
    const emps = S.employees();
    if (!emps.length) return [];
    const inicio = U.mondayOf(new Date());
    const fim = U.addDays(inicio, 8 * 7 - 1);
    R.ensureYear(inicio.getFullYear());
    if (fim.getFullYear() !== inicio.getFullYear()) R.ensureYear(fim.getFullYear());
    return S.departamentos().map((nome) => {
      const lista = emps.filter((e) => S.deptOf(e) === nome);
      let folgas = 0, dias = 0;
      for (let d = inicio; d <= fim; d = U.addDays(d, 1)) {
        if (d.getDay() === 0) continue;
        dias++;
        const k = U.toKey(d);
        lista.forEach((e) => { if (S.getDay(e.id, k) === 'F') folgas++; });
      }
      return { nome, pessoas: lista.length, minimo: dias ? Math.ceil(folgas / dias) : 0 };
    });
  }

  function changeLimit(dept, raw) {
    const n = Math.floor(Number(raw));
    const limite = raw === '' || !(n >= 1) ? null : n;
    const antes = S.limiteFolgas(dept);
    if (antes === limite) return;
    S.setLimiteFolgas(dept, limite);
    S.addLog({ acao: 'Limite de folgas no mesmo dia', detalhe: dept, de: antes ? String(antes) : 'Sem limite', para: limite ? String(limite) : 'Sem limite' });
    const minimo = (deptStats().find((d) => d.nome === dept) || {}).minimo;
    if (!limite) {
      U.toast(`${dept}: sem limite de folgas no mesmo dia.`, 'success');
    } else if (minimo && limite < minimo) {
      U.toast(`${dept}: limite salvo, mas com menos de ${minimo} por dia não cabem as folgas de todos do departamento.`, 'error');
    } else {
      U.toast(`${dept}: até ${limite} de folga no mesmo dia. Use Regenerar na tela de escala para reorganizar as semanas já montadas.`, 'success');
    }
    render(rootEl);
  }

  function readForm(el) {
    const data = { nome: el.querySelector('[name="nome"]').value.trim().replace(/\s+/g, ' ') };
    CAMPOS.forEach((c) => { data[c.id] = el.querySelector(`[name="${c.id}"]`).value; });
    data.abertura = el.querySelector('[name="abertura"]').checked;
    data.fechamento = el.querySelector('[name="fechamento"]').checked;
    return data;
  }

  // "Abertura", "Fechamento", "Abertura e fechamento" ou "Intermediário".
  function tipoTexto(s) {
    if (s.abertura && s.fechamento) return 'Abertura e fechamento';
    if (s.abertura) return 'Abertura';
    if (s.fechamento) return 'Fechamento';
    return 'Intermediário';
  }

  // Mostra a jornada calculada e os avisos enquanto o usuário preenche.
  function updatePreview(el) {
    const info = R.shiftInfo(readForm(el));
    const out = el.querySelector('#shift-preview');
    out.classList.remove('ok', 'has-warn');
    if (info.erro) {
      out.innerHTML = '<span class="muted">' + esc(info.erro) + '</span>';
      return;
    }
    out.classList.add(info.avisos.length ? 'has-warn' : 'ok');
    out.innerHTML = `
      <div class="preview-total"><strong>${R.formatHoras(info.trabalho)}</strong> de trabalho por dia e
        ${R.formatHoras(info.intervalo)} de almoço</div>
      ${info.avisos.map((a) => `<div class="preview-warn">${esc(a)}</div>`).join('')}`;
  }

  async function openForm(shift) {
    const body = `
      <form class="form-grid" id="shift-form" novalidate>
        <label class="span-2">Nome da escala
          <input name="nome" maxlength="60" autocomplete="off" placeholder="Ex.: Manhã, Tarde, Comercial" value="${esc(shift ? shift.nome : '')}">
        </label>
        ${CAMPOS.map((c) => `
          <label>${c.label}
            <input type="time" name="${c.id}" required value="${esc(shift ? shift[c.id] : '')}">
          </label>`).join('')}
        <fieldset class="check-group span-2">
          <legend>Este horário faz</legend>
          <label class="check"><input type="checkbox" name="abertura" ${shift && shift.abertura ? 'checked' : ''}> Abertura da loja</label>
          <label class="check"><input type="checkbox" name="fechamento" ${shift && shift.fechamento ? 'checked' : ''}> Fechamento da loja</label>
          <p class="field-hint">Quem faz o fechamento num dia não faz a abertura no dia seguinte: entre um turno e outro
            precisa haver 11h de descanso. Sem nenhuma marcação, o horário é intermediário.</p>
        </fieldset>
        <div class="shift-preview span-2" id="shift-preview"></div>
        <p class="form-error span-2" id="shift-error" hidden></p>
      </form>`;

    let data = null;
    const ok = await U.modal({
      title: shift ? 'Editar escala' : 'Adicionar escala',
      body,
      onOpen: (el) => {
        el.querySelectorAll('input').forEach((i) => i.addEventListener('input', () => updatePreview(el)));
        updatePreview(el);
        el.querySelector('[name="nome"]').focus();
      },
      buttons: [
        { label: 'Cancelar', value: false },
        {
          label: shift ? 'Salvar escala' : 'Adicionar escala', value: true, kind: 'primary',
          validate: (el) => {
            data = readForm(el);
            const err = validate(data, shift);
            const errEl = el.querySelector('#shift-error');
            errEl.textContent = err || '';
            errEl.hidden = !err;
            return !err;
          }
        }
      ]
    });
    if (!ok) return;
    const resumo = (s) => `${s.entrada}–${s.saidaAlmoco} / ${s.voltaAlmoco}–${s.saida}, ${tipoTexto(s).toLowerCase()}`;
    if (shift) {
      const antes = resumo(shift);
      S.updateShift(shift.id, data);
      S.addLog({ acao: 'Escala de horário editada', detalhe: data.nome, de: antes, para: resumo(data) });
      U.toast('Escala salva.', 'success');
    } else {
      S.addShift(data);
      S.addLog({ acao: 'Escala de horário cadastrada', detalhe: data.nome, para: resumo(data) });
      U.toast('Escala adicionada.', 'success');
    }
    render(rootEl);
  }

  function validate(data, current) {
    if (!data.nome) return 'Dê um nome para a escala.';
    const dup = S.shifts().find((s) => U.normalize(s.nome) === U.normalize(data.nome) && (!current || s.id !== current.id));
    if (dup) return 'Já existe uma escala com esse nome.';
    const info = R.shiftInfo(data);
    return info.erro || null;
  }

  async function remove(shift) {
    const n = S.employeesInShift(shift.id);
    const ok = await U.confirmDialog('Excluir escala',
      `Excluir a escala <strong>${esc(shift.nome)}</strong>?` +
      (n ? ` ${n} ${U.plural(n, 'funcionário fixo nela volta', 'funcionários fixos nela voltam')} para o rodízio.` : '') +
      ' Os dias que usavam este horário recebem outro do rodízio.',
      'Excluir', true);
    if (!ok) return;
    S.removeShift(shift.id);
    S.addLog({ acao: 'Escala de horário excluída', detalhe: shift.nome });
    U.toast('Escala excluída.', 'success');
    render(rootEl);
  }

  App.settingsView = { render };
})(window.App);
