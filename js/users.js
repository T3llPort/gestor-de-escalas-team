/* Tela de usuários: nome, e-mail, senha, papel e empresa.
   O master vê e cadastra usuários de todas as empresas; o gerente, só os da própria empresa. */
(function (App) {
  const U = App.util;
  const A = App.auth;
  const esc = U.escapeHtml;

  let rootEl = null;
  let filtroEmpresa = ''; // '' todas, 'master' sem empresa, ou id da empresa

  function me() { return App.currentUser; }
  function isMaster() { return me().papel === 'master'; }

  // Papéis que o usuário logado pode atribuir.
  function papeisPermitidos() {
    return isMaster() ? ['master', 'gerente', 'operador'] : ['gerente', 'operador'];
  }

  function visible() {
    let list = A.usuarios();
    if (!isMaster()) return list.filter((u) => u.empresaId === me().empresaId);
    if (filtroEmpresa === 'master') return list.filter((u) => u.papel === 'master');
    if (filtroEmpresa) return list.filter((u) => u.empresaId === filtroEmpresa);
    return list;
  }

  function empresaNome(id) {
    const e = id ? A.getEmpresa(id) : null;
    return e ? e.razaoSocial : '';
  }

  function render(root) {
    rootEl = root;
    const list = visible();
    const empresas = A.empresas();
    const master = isMaster();
    const minhaEmpresa = master ? null : A.getEmpresa(me().empresaId);

    root.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Usuários</h1>
          <p class="muted">${master
            ? 'Cadastre quem acessa a plataforma, vincule cada pessoa a uma empresa e escolha o papel dela.'
            : `Cadastre quem da ${esc(minhaEmpresa ? minhaEmpresa.razaoSocial : 'empresa')} acessa a plataforma e escolha o papel de cada pessoa.`}</p>
        </div>
        <div class="actions">
          <button class="btn primary" id="btn-add-user">Adicionar usuário</button>
        </div>
      </div>

      <section class="card list-card">
        <div class="section-head">
          <h2>Usuários cadastrados</h2>
          ${master ? `
          <label class="inline-filter">Mostrar
            <select id="user-filter">
              <option value="">Todas as empresas</option>
              <option value="master" ${filtroEmpresa === 'master' ? 'selected' : ''}>Usuários master</option>
              ${empresas.map((e) => `<option value="${e.id}" ${filtroEmpresa === e.id ? 'selected' : ''}>${esc(e.razaoSocial)}</option>`).join('')}
            </select>
          </label>` : `<span class="muted">${list.length} ${U.plural(list.length, 'usuário', 'usuários')}</span>`}
        </div>
        ${list.length ? `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                ${master ? '<th>Empresa</th>' : ''}
                <th>Acesso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map((u) => `
                <tr>
                  <td class="strong">${esc(u.nome)}${u.id === me().id ? ' <span class="muted">(você)</span>' : ''}</td>
                  <td>${esc(u.email)}</td>
                  <td><span class="role-badge r-${u.papel}">${A.PAPEIS[u.papel].label}</span></td>
                  ${master ? `<td>${u.papel === 'master' ? '<span class="muted">Plataforma</span>' : esc(empresaNome(u.empresaId))}</td>` : ''}
                  <td>${u.ativo ? '<span class="chip ok">Ativo</span>' : '<span class="chip off">Inativo</span>'}</td>
                  <td class="row-actions">
                    <button class="link" data-edit="${u.id}">Editar</button>
                    ${u.id === me().id || u.fixo ? '' : `<button class="link danger" data-del="${u.id}">Excluir</button>`}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `
        <div class="empty">Nenhum usuário ${filtroEmpresa ? 'neste filtro' : 'cadastrado'}.</div>`}
      </section>`;

    root.querySelector('#btn-add-user').addEventListener('click', () => openForm(null));
    const filter = root.querySelector('#user-filter');
    if (filter) filter.addEventListener('change', () => { filtroEmpresa = filter.value; render(root); });
    root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openForm(A.getUsuario(b.dataset.edit))));
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => remove(A.getUsuario(b.dataset.del))));
  }

  async function openForm(user) {
    const master = isMaster();
    const empresas = A.empresas();
    const proprio = user && user.id === me().id;
    const fixo = !!(user && user.fixo);
    const travado = proprio || fixo; // papel e acesso não mudam
    const papelAtual = user ? user.papel : (master ? 'gerente' : 'operador');
    const empresaAtual = user ? user.empresaId : (master ? (filtroEmpresa && filtroEmpresa !== 'master' ? filtroEmpresa : App.empresaAtiva || '') : me().empresaId);

    if (master && !empresas.length && !user) {
      const go = await U.modal({
        title: 'Adicionar usuário',
        body: '<p>Gerentes e operadores precisam estar vinculados a uma empresa, e ainda não há empresas cadastradas.</p>' +
          '<p class="muted">Você pode cadastrar outro usuário master agora ou cadastrar uma empresa antes.</p>',
        buttons: [
          { label: 'Cancelar', value: null },
          { label: 'Ir para Empresas', value: 'empresas' },
          { label: 'Cadastrar master', value: 'master', kind: 'primary' }
        ]
      });
      if (go === 'empresas') location.hash = '#empresas';
      if (go !== 'master') return;
    }

    const body = `
      <form class="form-grid" novalidate autocomplete="off">
        <label class="span-2">Nome
          <input name="nome" maxlength="80" value="${esc(user ? user.nome : '')}">
        </label>
        <label class="span-2">E-mail
          <input name="email" type="email" maxlength="120" autocomplete="off" value="${esc(user ? user.email : '')}">
        </label>
        <label>Papel
          <select name="papel" ${travado ? 'disabled' : ''}>
            ${papeisPermitidos().map((p) => `<option value="${p}" ${p === papelAtual ? 'selected' : ''}>${A.PAPEIS[p].label}</option>`).join('')}
          </select>
        </label>
        <label class="empresa-field">Empresa
          ${master ? `
          <select name="empresaId">
            <option value="">Escolha a empresa</option>
            ${empresas.map((e) => `<option value="${e.id}" ${e.id === empresaAtual ? 'selected' : ''}>${esc(e.razaoSocial)}${e.ativo ? '' : ' (inativa)'}</option>`).join('')}
          </select>` : `
          <input value="${esc(empresaNome(me().empresaId))}" disabled>`}
        </label>
        <p class="role-desc span-2" id="role-desc"></p>
        <label>${user ? 'Nova senha' : 'Senha'}
          <input name="senha" type="password" autocomplete="new-password" placeholder="${user ? 'Deixe em branco para manter' : ''}">
        </label>
        <label>Confirmar senha
          <input name="confirma" type="password" autocomplete="new-password">
        </label>
        <label>Acesso
          <select name="ativo" ${travado ? 'disabled' : ''}>
            <option value="1" ${!user || user.ativo ? 'selected' : ''}>Ativo</option>
            <option value="0" ${user && !user.ativo ? 'selected' : ''}>Inativo</option>
          </select>
        </label>
        <p class="field-hint span-2">${fixo
          ? 'Este é o acesso master fixo da plataforma: o papel e o acesso não podem ser mudados, e ele não pode ser excluído.'
          : proprio
          ? 'Você não pode mudar o próprio papel nem inativar o próprio acesso.'
          : `A senha precisa ter pelo menos ${A.SENHA_MIN} caracteres. Passe a senha para a pessoa por um meio seguro.`}</p>
        <p class="form-error span-2" id="user-error" hidden></p>
      </form>`;

    let data = null;
    const ok = await U.modal({
      title: user ? 'Editar usuário' : 'Adicionar usuário',
      body,
      onOpen: (el) => {
        const papel = el.querySelector('[name="papel"]');
        if (!user && master && !empresas.length) papel.value = 'master';
        const sync = () => {
          el.querySelector('#role-desc').textContent = A.PAPEIS[papel.value].desc;
          el.querySelector('.empresa-field').hidden = papel.value === 'master';
        };
        papel.addEventListener('change', sync);
        sync();
        el.querySelector('[name="nome"]').focus();
      },
      buttons: [
        { label: 'Cancelar', value: false },
        {
          label: user ? 'Salvar usuário' : 'Adicionar usuário', value: true, kind: 'primary',
          validate: (el) => {
            const v = (n) => el.querySelector(`[name="${n}"]`);
            const papel = v('papel').value;
            data = {
              nome: v('nome').value.trim().replace(/\s+/g, ' '),
              email: v('email').value.trim(),
              papel,
              empresaId: papel === 'master' ? null : (master ? v('empresaId').value : me().empresaId),
              ativo: v('ativo').value === '1',
              senha: v('senha').value,
              confirma: v('confirma').value
            };
            const err = validate(data, user);
            const errEl = el.querySelector('#user-error');
            errEl.textContent = err || '';
            errEl.hidden = !err;
            return !err;
          }
        }
      ]
    });
    if (!ok) return;
    const { confirma, ...dados } = data;
    if (user) {
      if (!dados.senha) delete dados.senha;
      A.updateUsuario(user.id, dados);
      if (user.id === me().id) App.refreshUser();
      U.toast('Usuário salvo.', 'success');
    } else {
      A.addUsuario(dados);
      U.toast(`Usuário adicionado. ${dados.nome} já pode entrar com o e-mail ${A.normEmail(dados.email)}.`, 'success');
    }
    render(rootEl);
  }

  function validate(d, current) {
    if (!d.nome) return 'Informe o nome.';
    if (!A.isValidEmail(d.email)) return 'Informe um e-mail válido.';
    const dup = A.findUsuarioByEmail(d.email);
    if (dup && (!current || dup.id !== current.id)) return 'Já existe um usuário com esse e-mail.';
    if (!papeisPermitidos().includes(d.papel)) return 'Papel não permitido.';
    if (d.papel !== 'master' && !d.empresaId) return 'Escolha a empresa do usuário.';
    if (!current || d.senha) {
      const errSenha = A.validarSenha(d.senha);
      if (errSenha) return errSenha;
      if (d.senha !== d.confirma) return 'A confirmação não é igual à senha.';
    }
    // Sempre precisa sobrar pelo menos um master ativo para administrar a plataforma.
    if (current && current.papel === 'master' && current.ativo && (d.papel !== 'master' || !d.ativo) && A.mastersAtivos() <= 1) {
      return 'Este é o único master ativo. Cadastre outro master antes de mudar este.';
    }
    return null;
  }

  async function remove(user) {
    if (user.papel === 'master' && user.ativo && A.mastersAtivos() <= 1) {
      U.toast('Este é o único master ativo e não pode ser excluído.', 'error');
      return;
    }
    const ok = await U.confirmDialog('Excluir usuário',
      `Excluir <strong>${esc(user.nome)}</strong> (${esc(user.email)})? A pessoa não vai mais conseguir entrar.`, 'Excluir', true);
    if (!ok) return;
    A.removeUsuario(user.id);
    U.toast('Usuário excluído.', 'success');
    render(rootEl);
  }

  App.usersView = { render };
})(window.App);
