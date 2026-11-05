/* Tela de empresas (somente master): CNPJ, razão social e acesso ativo ou inativo. */
(function (App) {
  const U = App.util;
  const A = App.auth;
  const esc = U.escapeHtml;

  let rootEl = null;
  let busca = '';

  function filtered() {
    const q = U.normalize(busca);
    const d = U.onlyDigits(busca);
    return A.empresas().filter((e) => !q || U.normalize(e.razaoSocial).includes(q) || (d && e.cnpj.includes(d)));
  }

  function render(root) {
    rootEl = root;
    const todas = A.empresas();
    const list = filtered();
    const ativas = todas.filter((e) => e.ativo).length;

    root.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Empresas</h1>
          <p class="muted">Cadastre as empresas que usam a plataforma. Com o acesso inativo, ninguém da empresa consegue entrar,
            mas os dados dela continuam guardados.</p>
        </div>
        <div class="actions">
          <button class="btn primary" id="btn-add-company">Adicionar empresa</button>
        </div>
      </div>

      <section class="card list-card">
        <div class="section-head">
          <h2>Empresas cadastradas</h2>
          <span class="muted">${todas.length ? `${ativas} ${U.plural(ativas, 'ativa', 'ativas')} de ${todas.length}` : ''}</span>
        </div>
        ${todas.length > 6 ? `
        <div class="list-tools">
          <input type="search" id="company-search" placeholder="Buscar por razão social ou CNPJ" value="${esc(busca)}">
        </div>` : ''}
        ${list.length ? `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Razão social</th>
                <th>CNPJ</th>
                <th>Usuários</th>
                <th>Funcionários</th>
                <th>Acesso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map((e) => `
                <tr>
                  <td class="strong">${esc(e.razaoSocial)}</td>
                  <td class="mono">${U.formatCNPJ(e.cnpj)}</td>
                  <td>${A.usuariosDaEmpresa(e.id)}</td>
                  <td>${App.store.countEmployees(e.id)}</td>
                  <td>${e.ativo ? '<span class="chip ok">Ativo</span>' : '<span class="chip off">Inativo</span>'}</td>
                  <td class="row-actions">
                    <button class="link" data-edit="${e.id}">Editar</button>
                    <button class="link" data-toggle="${e.id}">${e.ativo ? 'Inativar' : 'Ativar'}</button>
                    <button class="link danger" data-del="${e.id}">Excluir</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : todas.length ? `
        <div class="empty">Nenhuma empresa encontrada com essa busca.</div>` : `
        <div class="empty">
          Nenhuma empresa cadastrada ainda.<br>
          Use <strong>Adicionar empresa</strong> e informe o CNPJ e a razão social.
        </div>`}
      </section>`;

    root.querySelector('#btn-add-company').addEventListener('click', () => openForm(null));
    const search = root.querySelector('#company-search');
    if (search) {
      search.addEventListener('input', () => {
        busca = search.value;
        render(root);
        const s = root.querySelector('#company-search');
        s.focus();
        s.setSelectionRange(s.value.length, s.value.length);
      });
    }
    root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openForm(A.getEmpresa(b.dataset.edit))));
    root.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => toggle(A.getEmpresa(b.dataset.toggle))));
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(A.getEmpresa(b.dataset.del))));
  }

  async function openForm(emp) {
    const body = `
      <form class="form-grid" novalidate>
        <label class="span-2">Razão social
          <input name="razaoSocial" maxlength="120" autocomplete="off" value="${esc(emp ? emp.razaoSocial : '')}">
        </label>
        <label>CNPJ
          <input name="cnpj" inputmode="numeric" autocomplete="off" placeholder="00.000.000/0000-00" value="${emp ? U.formatCNPJ(emp.cnpj) : ''}">
        </label>
        <label>Acesso
          <select name="ativo">
            <option value="1" ${!emp || emp.ativo ? 'selected' : ''}>Ativo</option>
            <option value="0" ${emp && !emp.ativo ? 'selected' : ''}>Inativo</option>
          </select>
        </label>
        <p class="form-error span-2" id="company-error" hidden></p>
      </form>`;

    let data = null;
    const ok = await U.modal({
      title: emp ? 'Editar empresa' : 'Adicionar empresa',
      body,
      onOpen: (el) => {
        const cnpj = el.querySelector('[name="cnpj"]');
        cnpj.addEventListener('input', () => { cnpj.value = U.formatCNPJ(cnpj.value); });
        el.querySelector('[name="razaoSocial"]').focus();
      },
      buttons: [
        { label: 'Cancelar', value: false },
        {
          label: emp ? 'Salvar empresa' : 'Adicionar empresa', value: true, kind: 'primary',
          validate: (el) => {
            data = {
              razaoSocial: el.querySelector('[name="razaoSocial"]').value.trim().replace(/\s+/g, ' '),
              cnpj: U.onlyDigits(el.querySelector('[name="cnpj"]').value),
              ativo: el.querySelector('[name="ativo"]').value === '1'
            };
            const err = validate(data, emp);
            const errEl = el.querySelector('#company-error');
            errEl.textContent = err || '';
            errEl.hidden = !err;
            return !err;
          }
        }
      ]
    });
    if (!ok) return;
    if (emp) {
      A.updateEmpresa(emp.id, data);
      U.toast('Empresa salva.', 'success');
    } else {
      const r = A.addEmpresa(data);
      U.toast(r.herdouDados
        ? `Empresa adicionada. Os funcionários e escalas que já estavam neste navegador passaram para ${data.razaoSocial}.`
        : 'Empresa adicionada.', 'success');
    }
    render(rootEl);
  }

  function validate(data, current) {
    if (!data.razaoSocial) return 'Informe a razão social.';
    if (!U.isValidCNPJ(data.cnpj)) return 'CNPJ inválido. Confira os 14 números.';
    const dup = A.findEmpresaByCNPJ(data.cnpj);
    if (dup && (!current || dup.id !== current.id)) return `Este CNPJ já está cadastrado para ${dup.razaoSocial}.`;
    return null;
  }

  async function toggle(emp) {
    if (emp.ativo) {
      const n = A.usuariosDaEmpresa(emp.id);
      const ok = await U.confirmDialog('Inativar acesso',
        `Inativar o acesso de <strong>${esc(emp.razaoSocial)}</strong>?` +
        (n ? ` ${n} ${U.plural(n, 'usuário não vai conseguir', 'usuários não vão conseguir')} entrar até o acesso ser ativado de novo.` : '') +
        ' Os dados da empresa continuam guardados.',
        'Inativar', true);
      if (!ok) return;
    }
    A.updateEmpresa(emp.id, { ativo: !emp.ativo });
    U.toast(emp.ativo ? 'Acesso da empresa inativado.' : 'Acesso da empresa ativado.', 'success');
    render(rootEl);
  }

  async function remove(emp) {
    const usuarios = A.usuariosDaEmpresa(emp.id);
    if (usuarios) {
      await U.modal({
        title: 'Excluir empresa',
        body: `<p><strong>${esc(emp.razaoSocial)}</strong> tem ${usuarios} ${U.plural(usuarios, 'usuário', 'usuários')}.
          Exclua ou mude esses usuários de empresa antes, ou apenas inative o acesso.</p>`,
        buttons: [{ label: 'Entendi', value: true, kind: 'primary' }]
      });
      return;
    }
    const funcionarios = App.store.countEmployees(emp.id);
    const ok = await U.confirmDialog('Excluir empresa',
      `Excluir <strong>${esc(emp.razaoSocial)}</strong>?` +
      (funcionarios ? ` Os ${funcionarios} funcionários e as escalas dela serão apagados deste navegador.` : ''),
      'Excluir', true);
    if (!ok) return;
    A.removeEmpresa(emp.id);
    U.toast('Empresa excluída.', 'success');
    render(rootEl);
  }

  App.companiesView = { render };
})(window.App);
