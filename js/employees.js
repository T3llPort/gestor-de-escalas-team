/* Tela de cadastro de funcionários e importação por CSV. */
(function (App) {
  const U = App.util;
  const S = App.store;
  const esc = U.escapeHtml;

  let filtro = '';
  let editingId = null;

  function render(root) {
    const emps = S.employees();
    const editing = editingId ? S.getEmployee(editingId) : null;

    root.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Funcionários</h1>
          <p class="muted">${emps.length
            ? `${emps.length} ${U.plural(emps.length, 'pessoa cadastrada', 'pessoas cadastradas')}. Cadastre pelo formulário ou importe uma planilha CSV.`
            : 'Cadastre pelo formulário ou importe uma planilha CSV.'}</p>
        </div>
        <div class="actions">
          <button class="btn" id="btn-modelo">Baixar modelo CSV</button>
          <label class="btn primary file-btn">Importar CSV<input type="file" id="csv-file" accept=".csv,text/csv" hidden></label>
        </div>
      </div>

      <div class="layout-2">
        <form class="card form" id="emp-form" novalidate>
          <h2>${editing ? 'Editar funcionário' : 'Novo funcionário'}</h2>
          <label>Nome completo
            <input name="nome" required maxlength="120" autocomplete="off" value="${esc(editing ? editing.nome : '')}">
          </label>
          <label>CPF
            <input name="cpf" required inputmode="numeric" placeholder="000.000.000-00" maxlength="14" value="${esc(editing ? U.formatCPF(editing.cpf) : '')}">
          </label>
          <div class="row-2">
            <label>Sexo
              <select name="sexo" required>
                <option value="">Selecione</option>
                <option value="M" ${editing && editing.sexo === 'M' ? 'selected' : ''}>Masculino</option>
                <option value="F" ${editing && editing.sexo === 'F' ? 'selected' : ''}>Feminino</option>
              </select>
            </label>
            <label>Data de nascimento
              <input name="nascimento" type="date" required value="${esc(editing ? editing.nascimento : '')}">
            </label>
          </div>
          <div class="row-2">
            <label>Departamento
              <input name="departamento" required list="deptos-list" maxlength="60" autocomplete="off" placeholder="Ex.: Frente de caixa" value="${esc(editing ? editing.departamento || '' : '')}">
              <datalist id="deptos-list">${S.departamentos().map((d) => `<option value="${esc(d)}">`).join('')}</datalist>
            </label>
            <label>Cargo
              <input name="cargo" required list="cargos-list" maxlength="60" autocomplete="off" value="${esc(editing ? editing.cargo : '')}">
              <datalist id="cargos-list">${S.cargos().map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
            </label>
          </div>
          <p class="form-error" id="form-error" hidden></p>
          <div class="form-actions">
            ${editing ? '<button type="button" class="btn" id="btn-cancel">Cancelar</button>' : ''}
            <button type="submit" class="btn primary">${editing ? 'Salvar alterações' : 'Cadastrar'}</button>
          </div>
          <p class="hint">As folgas são distribuídas por <strong>departamento</strong>, para não faltar gente em nenhum
            setor no mesmo dia. Nos domingos, <strong>homens</strong> trabalham no máximo 2 seguidos e folgam o 3º;
            <strong>mulheres</strong> alternam: trabalham 1 e folgam o seguinte. Quem trabalha no domingo ganha uma
            folga a mais na semana seguinte.</p>
        </form>

        <div class="card list-card">
          <div class="list-tools">
            <input type="search" id="emp-search" placeholder="Buscar por nome, CPF, departamento ou cargo" value="${esc(filtro)}">
          </div>
          <div id="emp-list"></div>
        </div>
      </div>`;

    renderList(root);
    bind(root);
  }

  function renderList(root) {
    const emps = S.employees();
    const q = U.normalize(filtro);
    const qDigits = U.onlyDigits(filtro);
    const list = q
      ? emps.filter((e) => U.normalize(e.nome).includes(q) || (qDigits && e.cpf.includes(qDigits)) ||
          U.normalize(e.cargo).includes(q) || U.normalize(e.departamento).includes(q))
      : emps;
    const host = root.querySelector('#emp-list');
    host.innerHTML = `
          ${list.length ? `
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Nome</th><th>CPF</th><th>Sexo</th><th>Nascimento</th><th>Departamento</th><th>Cargo</th><th></th></tr></thead>
              <tbody>
                ${list.map((e) => `
                <tr class="${e.id === editingId ? 'selected' : ''}">
                  <td class="strong">${esc(e.nome)}</td>
                  <td class="mono">${U.formatCPF(e.cpf)}</td>
                  <td><span class="sex-badge ${e.sexo}">${e.sexo === 'M' ? 'Masculino' : 'Feminino'}</span></td>
                  <td>${U.formatDateBR(e.nascimento)} <span class="muted">(${U.age(e.nascimento)} anos)</span></td>
                  <td>${e.departamento ? esc(e.departamento) : '<span class="text-danger">Não informado</span>'}</td>
                  <td>${esc(e.cargo)}</td>
                  <td class="row-actions">
                    <button class="link" data-edit="${e.id}">Editar</button>
                    <button class="link danger" data-del="${e.id}">Excluir</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `
          <div class="empty">
            ${emps.length ? 'Nenhum funcionário encontrado para essa busca.' :
              'Nenhum funcionário cadastrado ainda.<br>Cadastre pelo formulário ou importe um arquivo CSV.'}
          </div>`}`;

    host.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      editingId = b.dataset.edit;
      render(root);
      root.querySelector('#emp-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    host.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const emp = S.getEmployee(b.dataset.del);
      const ok = await U.confirmDialog('Excluir funcionário',
        `Excluir <strong>${esc(emp.nome)}</strong>? A escala dele também será removida.`, 'Excluir', true);
      if (!ok) return;
      S.removeEmployee(emp.id);
      if (editingId === emp.id) editingId = null;
      App.scale.resetEnsured();
      U.toast('Funcionário excluído.', 'success');
      render(root);
    }));
  }

  function bind(root) {
    const form = root.querySelector('#emp-form');
    const cpfInput = form.elements.cpf;
    cpfInput.addEventListener('input', () => { cpfInput.value = U.formatCPF(cpfInput.value); });

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = {
        nome: form.elements.nome.value.trim().replace(/\s+/g, ' '),
        cpf: U.onlyDigits(cpfInput.value),
        sexo: form.elements.sexo.value,
        nascimento: form.elements.nascimento.value,
        departamento: form.elements.departamento.value.trim().replace(/\s+/g, ' '),
        cargo: form.elements.cargo.value.trim()
      };
      const err = validate(data);
      const errEl = root.querySelector('#form-error');
      if (err) { errEl.textContent = err; errEl.hidden = false; return; }
      if (editingId) {
        S.updateEmployee(editingId, data);
        U.toast('Funcionário atualizado.', 'success');
      } else {
        S.addEmployee(data);
        U.toast('Funcionário cadastrado. A escala do ano foi gerada para ele.', 'success');
      }
      editingId = null;
      App.scale.resetEnsured();
      render(root);
      root.querySelector('#emp-form input[name="nome"]').focus();
    });

    const cancel = root.querySelector('#btn-cancel');
    if (cancel) cancel.addEventListener('click', () => { editingId = null; render(root); });

    const search = root.querySelector('#emp-search');
    search.addEventListener('input', () => {
      filtro = search.value;
      renderList(root);
    });

    root.querySelector('#btn-modelo').addEventListener('click', () => {
      U.downloadFile('modelo-funcionarios.csv', App.csv.template(), 'text/csv;charset=utf-8');
    });

    root.querySelector('#csv-file').addEventListener('change', async (ev) => {
      const file = ev.target.files[0];
      ev.target.value = '';
      if (!file) return;
      const text = App.csv.decode(await file.arrayBuffer());
      const result = App.csv.toEmployees(App.csv.parse(text));
      await showImport(result);
      render(root);
    });
  }

  function validate(d) {
    if (d.nome.length < 3 || !d.nome.includes(' ')) return 'Informe o nome completo.';
    if (!U.isValidCPF(d.cpf)) return 'CPF inválido.';
    const dup = S.findByCPF(d.cpf);
    if (dup && dup.id !== editingId) return 'Já existe um funcionário com este CPF: ' + dup.nome + '.';
    if (!d.sexo) return 'Selecione o sexo.';
    if (!d.nascimento) return 'Informe a data de nascimento.';
    const idade = U.age(d.nascimento);
    if (idade < 14 || idade > 100) return 'Data de nascimento fora do intervalo esperado.';
    if (!d.departamento) return 'Informe o departamento.';
    if (!d.cargo) return 'Informe o cargo.';
    return null;
  }

  async function showImport({ ok, errors }) {
    const body = `
      <p><strong>${ok.length}</strong> funcionário(s) prontos para importar${errors.length ? ` · <strong class="text-danger">${errors.length}</strong> linha(s) com problema` : ''}.</p>
      ${ok.length ? `<div class="table-wrap small"><table class="table compact">
        <thead><tr><th>Nome</th><th>CPF</th><th>Sexo</th><th>Nascimento</th><th>Departamento</th><th>Cargo</th></tr></thead>
        <tbody>${ok.slice(0, 200).map((e) => `<tr><td>${esc(e.nome)}</td><td class="mono">${U.formatCPF(e.cpf)}</td><td>${e.sexo}</td><td>${U.formatDateBR(e.nascimento)}</td><td>${esc(e.departamento)}</td><td>${esc(e.cargo)}</td></tr>`).join('')}</tbody>
      </table></div>` : ''}
      ${errors.length ? `<h4>Linhas ignoradas</h4><ul class="error-list">${errors.map((e) =>
        `<li>Linha ${e.linha}${e.nome ? ' (' + esc(e.nome) + ')' : ''}: ${esc(e.motivo)}</li>`).join('')}</ul>` : ''}`;
    const buttons = ok.length
      ? [{ label: 'Cancelar', value: false }, { label: `Importar ${ok.length}`, value: true, kind: 'primary' }]
      : [{ label: 'Fechar', value: false }];
    const confirm = await U.modal({ title: 'Importação de CSV', body, buttons });
    if (confirm === true) {
      S.addEmployees(ok);
      App.scale.resetEnsured();
      U.toast(ok.length + ' funcionário(s) importado(s).', 'success');
    }
  }

  App.employeesView = { render };
})(window.App);
