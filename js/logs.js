/* Histórico de alterações da jornada (gerente e master): quem mudou o quê na escala da empresa. */
(function (App) {
  const U = App.util;
  const S = App.store;
  const esc = U.escapeHtml;

  const PAGINA = 100;
  const filtro = { de: '', ate: '', busca: '', acao: '' };
  let mostrar = PAGINA;
  let rootEl = null;

  function quando(iso) {
    const d = new Date(iso);
    return U.formatDateBR(U.toKey(d)) + ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  }

  function filtered() {
    const q = U.normalize(filtro.busca);
    return S.logs().reverse().filter((l) => {
      const dia = U.toKey(new Date(l.em));
      if (filtro.de && dia < filtro.de) return false;
      if (filtro.ate && dia > filtro.ate) return false;
      if (filtro.acao && l.acao !== filtro.acao) return false;
      if (q && !U.normalize([l.empNome, l.usuario, l.detalhe].join(' ')).includes(q)) return false;
      return true;
    });
  }

  function render(root) {
    rootEl = root;
    const todos = S.logs();
    const acoes = [...new Set(todos.map((l) => l.acao))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const list = filtered();
    const visiveis = list.slice(0, mostrar);
    const empresa = App.auth.getEmpresa(App.empresaAtiva);

    root.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Histórico de alterações</h1>
          <p class="muted">Tudo o que foi mudado à mão na jornada${empresa ? ` de ${esc(empresa.razaoSocial)}` : ''}: dias de trabalho e folga,
            horários, escalas de horário, regenerações e limite de folgas, com quem fez e quando.
            A geração automática do ano não entra aqui.</p>
        </div>
        <div class="actions">
          <button class="btn" id="btn-logs-export" ${list.length ? '' : 'disabled'}>Exportar CSV</button>
        </div>
      </div>

      <section class="card list-card">
        <div class="list-tools logs-tools">
          <label>De <input type="date" id="log-de" value="${filtro.de}"></label>
          <label>Até <input type="date" id="log-ate" value="${filtro.ate}"></label>
          <label>Alteração
            <select id="log-acao">
              <option value="">Todas</option>
              ${acoes.map((a) => `<option ${a === filtro.acao ? 'selected' : ''}>${esc(a)}</option>`).join('')}
            </select>
          </label>
          <label class="grow">Funcionário ou usuário
            <input type="search" id="log-busca" value="${esc(filtro.busca)}" placeholder="Buscar por nome">
          </label>
        </div>
        ${list.length ? `
        <div class="table-wrap">
          <table class="table logs-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Usuário</th>
                <th>Alteração</th>
                <th>Funcionário</th>
                <th>Dia</th>
                <th>Antes</th>
                <th>Depois</th>
              </tr>
            </thead>
            <tbody>
              ${visiveis.map((l) => `
                <tr>
                  <td class="mono">${quando(l.em)}</td>
                  <td>${esc(l.usuario)}</td>
                  <td class="strong">${esc(l.acao)}${l.detalhe ? `<span class="log-detail">${esc(l.detalhe)}</span>` : ''}</td>
                  <td>${esc(l.empNome || '')}</td>
                  <td class="mono">${l.data ? U.formatDateBR(l.data) : ''}</td>
                  <td class="log-de">${esc(l.de || '')}</td>
                  <td class="log-para">${esc(l.para || '')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="logs-foot">
          <span class="muted">Mostrando ${visiveis.length} de ${list.length} ${U.plural(list.length, 'alteração', 'alterações')}</span>
          ${list.length > visiveis.length ? '<button class="btn" id="btn-logs-more">Mostrar mais</button>' : ''}
        </div>` : `
        <div class="empty">${todos.length ? 'Nenhuma alteração com esses filtros.' : 'Nenhuma alteração registrada ainda. As mudanças feitas na escala aparecem aqui.'}</div>`}
      </section>`;

    const refiltra = (campo, valor) => { filtro[campo] = valor; mostrar = PAGINA; render(rootEl); };
    root.querySelector('#log-de').addEventListener('change', (e) => refiltra('de', e.target.value));
    root.querySelector('#log-ate').addEventListener('change', (e) => refiltra('ate', e.target.value));
    root.querySelector('#log-acao').addEventListener('change', (e) => refiltra('acao', e.target.value));
    let t = null;
    root.querySelector('#log-busca').addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        refiltra('busca', e.target.value);
        const s = rootEl.querySelector('#log-busca');
        s.focus();
        s.setSelectionRange(s.value.length, s.value.length);
      }, 250);
    });
    const more = root.querySelector('#btn-logs-more');
    if (more) more.addEventListener('click', () => { mostrar += PAGINA; render(rootEl); });
    root.querySelector('#btn-logs-export').addEventListener('click', () => exportCSV(list));
  }

  function exportCSV(list) {
    const rows = [['Quando', 'Usuário', 'Alteração', 'Detalhe', 'Funcionário', 'Dia', 'Antes', 'Depois']];
    list.forEach((l) => rows.push([quando(l.em), l.usuario, l.acao, l.detalhe || '', l.empNome || '',
      l.data ? U.formatDateBR(l.data) : '', l.de || '', l.para || '']));
    U.downloadFile(`historico-escala-${U.toKey(new Date())}.csv`, App.csv.toCSV(rows), 'text/csv;charset=utf-8');
  }

  App.logsView = { render };
})(window.App);
