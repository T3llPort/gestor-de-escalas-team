/* Início do sistema: login, navegação pela barra lateral conforme o papel do usuário,
   resumo dos dados, tema e backup. */
(function (App) {
  const U = App.util;
  const A = App.auth;
  const esc = U.escapeHtml;
  const view = () => document.getElementById('view');

  const ROUTES = {
    empresas: () => App.companiesView.render(view()),
    usuarios: () => App.usersView.render(view()),
    escala: () => App.scheduleView.render(view()),
    funcionarios: () => App.employeesView.render(view()),
    configuracoes: () => App.settingsView.render(view()),
    historico: () => App.logsView.render(view())
  };

  // Telas que trabalham com os dados de uma empresa (funcionários, escala, configurações, histórico).
  const ROTAS_EMPRESA = ['escala', 'funcionarios', 'configuracoes', 'historico'];
  // Empresa escolhida pelo master na barra lateral, lembrada neste navegador.
  const EMPRESA_MASTER_KEY = 'escalas5x2:empresaMaster';

  App.currentUser = null;
  App.empresaAtiva = null; // id da empresa cujos dados estão abertos

  // Gerentes e operadores trabalham na própria empresa; o master, na que escolheu (ou na primeira).
  function empresaInicial(user) {
    if (user.papel !== 'master') return user.empresaId;
    let id = null;
    try { id = localStorage.getItem(EMPRESA_MASTER_KEY); } catch (e) { /* sem armazenamento */ }
    if (id && A.getEmpresa(id)) return id;
    const lista = A.empresas();
    return lista.length ? lista[0].id : null;
  }

  function openEmpresa(id) {
    App.empresaAtiva = id || null;
    App.store.open(App.empresaAtiva);
    App.scale.resetEnsured();
  }

  // ---------- Login e sessão ----------
  function boot(mensagem) {
    const user = A.currentUser();
    App.currentUser = user;
    if (!user) {
      showLogin(mensagem || A.takeBloqueio());
      return;
    }
    document.body.classList.remove('auth-mode');
    document.getElementById('auth-root').innerHTML = '';
    openEmpresa(empresaInicial(user));
    applyRole(user);
    updateSummary();
    route();
  }

  // ---------- Escolha da empresa (master) ----------
  function renderCompanyPicker(user) {
    const box = document.getElementById('company-picker');
    box.hidden = user.papel !== 'master';
    if (box.hidden) return;
    const lista = A.empresas();
    const select = document.getElementById('company-select');
    select.hidden = !lista.length;
    document.getElementById('company-empty').hidden = !!lista.length;
    select.innerHTML = lista.map((e) =>
      `<option value="${e.id}" ${e.id === App.empresaAtiva ? 'selected' : ''}>${esc(e.razaoSocial)}${e.ativo ? '' : ' (inativa)'}</option>`
    ).join('');
  }

  document.getElementById('company-select').addEventListener('change', (e) => {
    try { localStorage.setItem(EMPRESA_MASTER_KEY, e.target.value); } catch (err) { /* sem armazenamento */ }
    openEmpresa(e.target.value);
    applyRole(App.currentUser);
    updateSummary();
    const empresa = A.getEmpresa(App.empresaAtiva);
    U.toast('Ajustando a escala de ' + empresa.razaoSocial + '.', 'success');
    route();
  });

  function showLogin(mensagem) {
    document.body.classList.add('auth-mode');
    view().innerHTML = '';
    closeMenu();
    App.loginView.render(document.getElementById('auth-root'), {
      mensagem,
      onSuccess: () => {
        history.replaceState(null, '', location.pathname);
        boot();
      }
    });
  }

  function logout() {
    A.logout();
    App.currentUser = null;
    App.store.open(null);
    history.replaceState(null, '', location.pathname);
    boot();
  }

  // Atualiza nome e papel na barra lateral depois de o usuário editar o próprio cadastro.
  App.refreshUser = function () {
    const user = A.currentUser();
    if (!user) { boot(); return; }
    App.currentUser = user;
    applyRole(user);
  };

  // Mostra no menu só as telas do papel do usuário.
  function applyRole(user) {
    document.querySelectorAll('.nav a[data-route]').forEach((a) => {
      a.hidden = !A.canAccess(user, a.dataset.route);
    });
    const master = user.papel === 'master';
    // Backup: gerente (da própria empresa) e master (da empresa escolhida).
    document.getElementById('nav-dados').hidden = user.papel === 'operador' || !App.empresaAtiva;
    document.querySelector('.brand').setAttribute('href', '#' + A.homeRoute(user));
    const empresa = App.empresaAtiva ? A.getEmpresa(App.empresaAtiva) : null;
    document.getElementById('user-name').textContent = user.nome;
    document.getElementById('user-role').textContent = A.PAPEIS[user.papel].label +
      (master ? ' da plataforma' : empresa ? ' em ' + empresa.razaoSocial : '');
    document.querySelector('.brand-sub').textContent = empresa ? empresa.razaoSocial : 'Administração';
    document.querySelector('.mobile-title').textContent = master && empresa ? empresa.razaoSocial : 'Gestor de Escalas Team';
    renderCompanyPicker(user);
  }

  function semEmpresa() {
    view().innerHTML = `
      <div class="card empty big">
        <p>Nenhuma empresa cadastrada</p>
        <p class="muted">Cadastre uma empresa para montar a escala, os funcionários e as configurações dela.</p>
        <a class="btn primary" href="#empresas">Cadastrar empresa</a>
      </div>`;
  }

  function route() {
    const user = App.currentUser;
    if (!user) return;
    // Cada navegação confere de novo se o usuário e a empresa continuam ativos.
    const atual = A.currentUser();
    if (!atual) { boot(); return; }
    const name = (location.hash || '').slice(1);
    const target = ROUTES[name] && A.canAccess(user, name) ? name : A.homeRoute(user);
    if (target !== name) history.replaceState(null, '', '#' + target);
    document.querySelectorAll('.nav a').forEach((a) => {
      const active = a.dataset.route === target;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    closeMenu();
    if (ROTAS_EMPRESA.includes(target) && !App.empresaAtiva) semEmpresa();
    else ROUTES[target]();
  }

  // ---------- Resumo da barra lateral ----------
  function updateSummary() {
    const user = App.currentUser;
    const box = document.getElementById('side-summary');
    if (!user) { box.innerHTML = ''; return; }
    if (!App.empresaAtiva) {
      const empresas = A.empresas();
      const ativas = empresas.filter((e) => e.ativo).length;
      const usuarios = A.usuarios().length;
      document.getElementById('nav-count').textContent = 0;
      box.innerHTML = `
        <div class="sum-title">Plataforma</div>
        <div class="sum-total"><strong>${empresas.length}</strong><span>${U.plural(empresas.length, 'empresa', 'empresas')}, ${ativas} ${U.plural(ativas, 'ativa', 'ativas')}</span></div>
        <div class="sum-split"><strong>${usuarios}</strong> ${U.plural(usuarios, 'usuário cadastrado', 'usuários cadastrados')}</div>
        <p class="sum-note">Dados salvos neste navegador.</p>`;
      return;
    }

    const emps = App.store.employees();
    const homens = emps.filter((e) => e.sexo === 'M').length;
    // Quadro por departamento (cadastros sem departamento entram pelo cargo).
    const porCargo = new Map();
    emps.forEach((e) => { const d = App.store.deptOf(e); porCargo.set(d, (porCargo.get(d) || 0) + 1); });
    const cargos = Array.from(porCargo.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));

    const mulheres = emps.length - homens;
    document.getElementById('nav-count').textContent = emps.length;
    box.innerHTML = `
      <div class="sum-title">Quadro de funcionários</div>
      <div class="sum-total"><strong>${emps.length}</strong><span>${U.plural(emps.length, 'pessoa', 'pessoas')} em ${cargos.length} ${U.plural(cargos.length, 'departamento', 'departamentos')}</span></div>
      ${emps.length ? `<div class="sum-split"><strong>${homens}</strong> ${U.plural(homens, 'homem', 'homens')} e <strong>${mulheres}</strong> ${U.plural(mulheres, 'mulher', 'mulheres')}</div>` : ''}
      ${cargos.length ? `<ul class="sum-cargos">
        ${cargos.map(([c, n]) => `<li><span>${esc(c)}</span><span>${n}</span></li>`).join('')}
      </ul>` : ''}
      <p class="sum-note">Dados salvos neste navegador.</p>`;
  }

  // ---------- Tema (claro, escuro ou seguir o sistema) ----------
  const THEME_KEY = 'escalas5x2:tema';

  function currentTheme() {
    try {
      const t = localStorage.getItem(THEME_KEY);
      return t === 'light' || t === 'dark' ? t : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function applyTheme(choice) {
    const root = document.documentElement;
    if (choice === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
    try {
      if (choice === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, choice);
    } catch (e) { /* sem armazenamento: o tema vale só para esta visita */ }
    document.querySelectorAll('[data-theme-choice]').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.themeChoice === choice));
    });
  }

  // Chamado pela tela de escala com o total de alertas da semana exibida.
  App.setAlertBadge = function (n) {
    const el = document.getElementById('nav-alerts');
    el.hidden = !n;
    el.textContent = n;
    el.title = n + ' ' + U.plural(n, 'alerta de regra', 'alertas de regra') + ' na semana aberta';
  };

  // ---------- Alterar a própria senha ----------
  async function changePassword() {
    closeMenu();
    let erro = null;
    const ok = await U.modal({
      title: 'Alterar senha',
      body: `
        <form class="form-grid" novalidate>
          <label class="span-2">Senha atual
            <input name="atual" type="password" autocomplete="current-password">
          </label>
          <label>Nova senha
            <input name="nova" type="password" autocomplete="new-password">
          </label>
          <label>Confirmar nova senha
            <input name="confirma" type="password" autocomplete="new-password">
          </label>
          <p class="field-hint span-2">Pelo menos ${A.SENHA_MIN} caracteres.</p>
          <p class="form-error span-2" id="pw-error" hidden></p>
        </form>`,
      onOpen: (el) => el.querySelector('[name="atual"]').focus(),
      buttons: [
        { label: 'Cancelar', value: false },
        {
          label: 'Alterar senha', value: true, kind: 'primary',
          validate: (el) => {
            const v = (n) => el.querySelector(`[name="${n}"]`).value;
            erro = v('nova') !== v('confirma') ? 'A confirmação não é igual à nova senha.' : A.changeOwnPassword(v('atual'), v('nova'));
            const errEl = el.querySelector('#pw-error');
            errEl.textContent = erro || '';
            errEl.hidden = !erro;
            return !erro;
          }
        }
      ]
    });
    if (ok) U.toast('Senha alterada.', 'success');
  }

  // ---------- Backup (dados da empresa aberta) ----------
  function downloadBackup() {
    const empresa = A.getEmpresa(App.empresaAtiva);
    const nome = empresa ? U.normalize(empresa.razaoSocial).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'empresa';
    U.downloadFile(`backup-escalas-${nome}-${U.toKey(new Date())}.json`, App.store.exportJSON(), 'application/json');
    U.toast('Backup baixado.', 'success');
  }

  function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const empresa = A.getEmpresa(App.empresaAtiva);
      const ok = await U.confirmDialog('Restaurar backup',
        `Os dados atuais de <strong>${esc(empresa ? empresa.razaoSocial : 'empresa')}</strong> (funcionários e escalas) ` +
        'serão substituídos pelo conteúdo do arquivo. Continuar?', 'Restaurar', true);
      if (!ok) return;
      try {
        App.store.importJSON(await file.text());
        App.store.addLog({ acao: 'Backup restaurado', detalhe: file.name });
        App.scale.resetEnsured();
        U.toast('Backup restaurado.', 'success');
        route();
      } catch (e) {
        U.toast(e.message || 'Arquivo inválido.', 'error');
      }
    });
    input.click();
  }

  // ---------- Menu no celular ----------
  const toggle = document.getElementById('menu-toggle');
  function closeMenu() {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.getElementById('sidebar-backdrop').addEventListener('click', closeMenu);

  document.getElementById('btn-backup-download').addEventListener('click', () => { closeMenu(); downloadBackup(); });
  document.getElementById('btn-backup-restore').addEventListener('click', () => { closeMenu(); restoreBackup(); });
  document.getElementById('btn-password').addEventListener('click', changePassword);
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.querySelectorAll('[data-theme-choice]').forEach((b) => {
    b.addEventListener('click', () => applyTheme(b.dataset.themeChoice));
  });
  document.addEventListener('escalas:dados', () => {
    const user = App.currentUser;
    if (!user) return;
    // Master: a empresa aberta foi excluída, ou a primeira empresa acabou de ser cadastrada.
    if (user.papel === 'master') {
      const valida = App.empresaAtiva && A.getEmpresa(App.empresaAtiva);
      if (!valida) openEmpresa(empresaInicial(user));
    }
    applyRole(user);
    updateSummary();
  });
  window.addEventListener('hashchange', route);

  applyTheme(currentTheme());
  boot();
})(window.App);
