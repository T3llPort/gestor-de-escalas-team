# Layouts

Stack: vanilla HTML/CSS/JS SPA (no framework, no build step, no package.json). Classic scripts share a global `window.App` namespace.
Views render HTML strings with template literals into `<main id="view">`. Styling is a single hand-written `css/styles.css` with CSS custom properties (no Tailwind).
Fonts: Barlow (body) + Barlow Condensed (display) from Google Fonts. Icons are inline SVG (stroke icons, 24px viewBox). Language: pt-BR.

## App shell — `index.html`
Fixed left sidebar (252px, red background in light theme, near-black in dark) with: price-tag logo SVG "5x2" + "Escalas" + company name; company picker (master only); vertical nav with stroke icons (Escala da semana, Funcionários, Configurações, Histórico, Empresas, Usuários) and count/alert badges; "Dados" group (backup buttons); footer with team summary, user box (name, role, Alterar senha / Sair) and a 3-way theme switch (Claro / Escuro / Sistema).
Main content: `<main id="view" class="container">` (max-width 1520px, padding 28px 32px, margin-left = sidebar width). Below 900px the sidebar becomes a slide-in drawer opened from a red top bar (`.mobile-bar`).
Login renders into `#auth-root` with `body.auth-mode` (hides the shell): two-column screen, red brand panel left, form right.

### `index.html`

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Escalas 5x2</title>
  <script>
    // Aplica o tema salvo antes da página aparecer, para não piscar.
    try {
      var tema = localStorage.getItem('escalas5x2:tema');
      if (tema === 'light' || tema === 'dark') document.documentElement.setAttribute('data-theme', tema);
    } catch (e) {}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="auth-mode">
  <header class="mobile-bar">
    <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <span class="mobile-title">Escalas 5x2</span>
  </header>

  <aside class="sidebar" id="sidebar">
    <a class="brand" href="#escala" aria-label="Escalas 5x2, ir para a escala">
      <svg class="tag" viewBox="0 0 56 34" aria-hidden="true">
        <path class="tag-body" d="M15 2h37a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H15L2 17z"/>
        <circle class="tag-hole" cx="12" cy="17" r="2.6"/>
        <text class="tag-text" x="34" y="23.5" text-anchor="middle">5x2</text>
      </svg>
      <span class="brand-text">
        <span class="brand-name">Escalas</span>
        <span class="brand-sub">Supermercado</span>
      </span>
    </a>

    <div class="company-picker" id="company-picker" hidden>
      <label for="company-select">Empresa em ajuste</label>
      <select id="company-select"></select>
      <p class="company-empty" id="company-empty" hidden>Nenhuma empresa cadastrada. <a href="#empresas">Cadastrar empresa</a></p>
    </div>

    <nav class="nav" aria-label="Menu principal">
      <a href="#escala" data-route="escala">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
        <span class="nav-text">Escala da semana</span>
        <span class="nav-badge alert" id="nav-alerts" hidden></span>
      </a>
      <a href="#funcionarios" data-route="funcionarios">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/></svg>
        <span class="nav-text">Funcionários</span>
        <span class="nav-badge" id="nav-count">0</span>
      </a>
      <a href="#configuracoes" data-route="configuracoes">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
        <span class="nav-text">Configurações</span>
      </a>
      <a href="#historico" data-route="historico">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4v4h4M12 7.5V12l3 2"/></svg>
        <span class="nav-text">Histórico</span>
      </a>
      <a href="#empresas" data-route="empresas">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V8l7-4 7 4v13"/><path d="M9 21v-5h6v5M9 11h1M14 11h1"/></svg>
        <span class="nav-text">Empresas</span>
      </a>
      <a href="#usuarios" data-route="usuarios">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.7 3.4-5.6 7-5.6s6.3 1.9 7 5.6"/><path d="M17.5 3.5l1 1 2-2"/></svg>
        <span class="nav-text">Usuários</span>
      </a>

      <div class="nav-dados" id="nav-dados">
        <div class="nav-group">Dados</div>
        <button type="button" id="btn-backup-download">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>
          <span class="nav-text">Baixar backup</span>
        </button>
        <button type="button" id="btn-backup-restore">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>
          <span class="nav-text">Restaurar backup</span>
        </button>
      </div>
    </nav>

    <div class="side-foot">
      <section class="side-summary" id="side-summary" aria-label="Resumo"></section>

      <section class="user-box" aria-label="Usuário conectado">
        <div class="user-info">
          <span class="user-name" id="user-name"></span>
          <span class="user-role" id="user-role"></span>
        </div>
        <div class="user-actions">
          <button type="button" id="btn-password">Alterar senha</button>
          <button type="button" id="btn-logout">Sair</button>
        </div>
      </section>

      <div class="theme-switch" role="radiogroup" aria-label="Tema do sistema">
        <button type="button" role="radio" data-theme-choice="light" title="Tema claro">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>
          <span>Claro</span>
        </button>
        <button type="button" role="radio" data-theme-choice="dark" title="Tema escuro">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
          <span>Escuro</span>
        </button>
        <button type="button" role="radio" data-theme-choice="auto" title="Seguir o tema do computador">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>
          <span>Sistema</span>
        </button>
      </div>
    </div>
  </aside>
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

  <main id="view" class="container"></main>
  <div id="auth-root"></div>
  <div id="print-root"></div>
  <div id="toasts" class="toasts" aria-live="polite"></div>

  <script src="js/util.js"></script>
  <script src="js/store.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/scale.js"></script>
  <script src="js/csv.js"></script>
  <script src="js/print.js"></script>
  <script src="js/login.js"></script>
  <script src="js/companies.js"></script>
  <script src="js/users.js"></script>
  <script src="js/employees.js"></script>
  <script src="js/schedule.js"></script>
  <script src="js/settings.js"></script>
  <script src="js/logs.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```


## Sidebar CSS
```css
/* ---------- Barra lateral ---------- */
.sidebar {
  position: fixed; inset: 0 auto 0 0; z-index: 30; width: var(--sidebar-w);
  display: flex; flex-direction: column;
  background: var(--side-bg); color: var(--side-fg);
  overflow-y: auto; padding: 20px 14px 14px;
}
.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 2px 8px 22px; color: inherit; text-decoration: none;
}
.tag { width: 60px; height: 36px; flex: none; }
.tag-body { fill: var(--tag-body); }
.tag-hole { fill: var(--side-bg); }
.tag-text { fill: var(--tag-text); font-family: var(--font-display); font-weight: 700; font-size: 17px; }
.brand-text { display: flex; flex-direction: column; }
.brand-name { font-family: var(--font-display); font-weight: 700; font-size: 26px; line-height: 1; }
.brand-sub { font-size: 13px; color: var(--side-muted); margin-top: 3px; }

.nav { display: flex; flex-direction: column; gap: 2px; }
.nav a, .nav button {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 10px 12px; border: 0; border-radius: 6px; background: transparent;
  color: var(--side-muted); font: inherit; font-weight: 500; text-align: left;
  text-decoration: none; cursor: pointer;
}
.nav svg { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.nav-text { flex: 1; }
.nav a:hover, .nav button:hover { background: var(--side-hover); color: var(--side-fg); }
.nav a.active { background: var(--side-active-bg); color: var(--side-active-fg); font-weight: 600; }
.nav a:focus-visible, .nav button:focus-visible, .brand:focus-visible, .theme-switch button:focus-visible {
  outline: 2px solid var(--side-fg); outline-offset: 1px;
}
.nav-group { font-size: 13px; font-weight: 600; color: var(--side-faint); padding: 20px 12px 6px; }
.nav-badge {
  min-width: 24px; height: 22px; padding: 0 7px; border-radius: 4px;
  display: inline-grid; place-items: center;
  font-family: var(--font-display); font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums;
  background: var(--side-chip); color: var(--side-fg);
}
.nav a.active .nav-badge { background: var(--red-soft); color: var(--red-strong); }
.nav-badge.alert, .nav a.active .nav-badge.alert { background: var(--alert-line); color: #2b1b00; }
.nav-badge[hidden] { display: none; }

.side-foot { margin-top: auto; padding-top: 18px; display: flex; flex-direction: column; gap: 14px; }
.side-summary { border-top: 1px solid var(--side-line); padding: 16px 12px 0; }
.sum-title { font-size: 13px; font-weight: 600; color: var(--side-faint); margin-bottom: 8px; }
.sum-total { display: flex; align-items: baseline; gap: 8px; }
.sum-total strong { font-family: var(--font-display); font-size: 40px; line-height: 1; font-variant-numeric: tabular-nums; }
.sum-total span { color: var(--side-muted); font-size: 14px; }
.sum-split { font-size: 14px; color: var(--side-muted); margin: 4px 0 10px; }
.sum-split strong { color: var(--side-fg); font-weight: 600; }
.sum-cargos { list-style: none; margin: 0; padding: 0; font-size: 14px; max-height: 168px; overflow-y: auto; }
.sum-cargos li { display: flex; justify-content: space-between; gap: 8px; padding: 5px 0; border-top: 1px dashed var(--side-line); }
.sum-cargos li span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--side-muted); }
.sum-cargos li span:last-child { font-family: var(--font-display); font-weight: 700; font-size: 16px; font-variant-numeric: tabular-nums; }
.sum-note { font-size: 12px; color: var(--side-faint); margin: 10px 0 0; }

.theme-switch {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
  padding: 3px; border-radius: 8px; background: var(--side-hover);
}
.theme-switch button {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px 2px; border: 0; border-radius: 6px; background: transparent;
  color: var(--side-muted); font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
}
.theme-switch svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.theme-switch button:hover { color: var(--side-fg); }
.theme-switch button[aria-checked="true"] { background: var(--side-active-bg); color: var(--side-active-fg); font-weight: 600; }

/* Empresa em ajuste (master) */
.company-picker { margin: 0 4px 16px; padding: 10px 10px 12px; border-radius: 8px; background: var(--side-hover); }
.company-picker label { display: block; font-size: 13px; font-weight: 600; color: var(--side-faint); margin-bottom: 6px; }
.company-picker select {
  width: 100%; height: 38px; background: var(--side-bg); color: var(--side-fg);
  border-color: var(--side-line); font-weight: 600;
}
.company-picker select:focus { outline: 2px solid var(--side-fg); }
.company-empty { margin: 0; font-size: 13px; color: var(--side-muted); }
.company-empty a { color: var(--side-fg); font-weight: 600; }

/* Usuário conectado */
.user-box { border-top: 1px solid var(--side-line); padding: 14px 12px 0; display: flex; flex-direction: column; gap: 8px; }
.user-info { display: flex; flex-direction: column; min-width: 0; }
.user-name { font-weight: 600; color: var(--side-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 13px; color: var(--side-muted); }
.user-actions { display: flex; gap: 6px; }
.user-actions button {
  flex: 1; height: 32px; border: 1px solid var(--side-line); border-radius: 6px; background: transparent;
  color: var(--side-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
}
.user-actions button:hover { background: var(--side-hover); color: var(--side-fg); }
.user-actions button:focus-visible { outline: 2px solid var(--side-fg); outline-offset: 1px; }

.mobile-bar, .sidebar-backdrop { display: none; }

.cell .c-sub { display: block; font-family: var(--font-body); font-size: 12px; font-weight: 500; opacity: .85; }
.dept-limits input.dept-limit { width: 120px; height: 34px; font-family: var(--font-display); font-size: 17px; font-weight: 600; }

/* Tipo do turno: abertura, fechamento */
.cell .c-tag {
  display: block; width: fit-content; margin: 0 auto 2px; padding: 0 5px; border-radius: 3px;
  font-family: var(--font-body); font-size: 11px; font-weight: 600; line-height: 15px;
  background: var(--surface-2); color: var(--ink-2);
}
.cell .c-tag.t-ab { background: #fff1c2; color: #6b4a00; }
.cell .c-tag.t-fe { background: #dfe6f7; color: #233f7a; }
.cell .c-tag.t-ab.t-fe { background: linear-gradient(90deg, #fff1c2 50%, #dfe6f7 50%); color: #333; }
.shift-type { font-size: 13px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: var(--surface-2); color: var(--ink-2); white-space: nowrap; }
.shift-type.t-ab { background: #fff1c2; color: #6b4a00; }
.shift-type.t-fe { background: #dfe6f7; color: #233f7a; }
.shift-type.t-ab.t-fe { background: linear-gradient(90deg, #fff1c2 50%, #dfe6f7 50%); color: #333; }
.check-group { border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px 12px; margin: 0; display: flex; flex-wrap: wrap; gap: 8px 24px; }
.check-group legend { padding: 0 6px; font-weight: 600; font-size: 14px; }
.check-group .check { flex-direction: row !important; align-items: center; gap: 8px !important; font-weight: 500 !important; font-size: 15px !important; cursor: pointer; }
.check-group .check input { width: 18px; height: 18px; accent-color: var(--red); }
.check-group .field-hint { flex-basis: 100%; }

/* Histórico */
.logs-tools { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: flex-end; }
.logs-tools label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
.logs-tools label.grow { flex: 1 1 220px; }
.logs-tools label.grow input { width: 100%; }
.logs-table td { white-space: normal; vertical-align: top; }
.logs-table td.mono { white-space: nowrap; }
.log-detail { display: block; font-weight: 400; font-size: 13px; color: var(--ink-3); }
.log-de { color: var(--ink-3); }
.logs-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 18px; border-top: 1px solid var(--line); }

.field-block { display: flex; flex-direction: column; gap: 5px; font-weight: 600; font-size: 14px; max-width: 240px; margin-top: 12px; }
```

## Login CSS
```css
/* ---------- Login ---------- */
#auth-root { display: none; }
body.auth-mode #auth-root { display: block; }
body.auth-mode .sidebar, body.auth-mode .mobile-bar, body.auth-mode .sidebar-backdrop, body.auth-mode #view { display: none !important; }
.auth { display: grid; grid-template-columns: minmax(280px, 5fr) 7fr; min-height: 100vh; }
.auth-side {
  background: var(--red); color: #fff; padding: 56px 48px;
  display: flex; flex-direction: column; justify-content: flex-end; gap: 10px;
}
.auth-tag { width: 132px; height: 80px; margin-bottom: 18px; }
.auth-tag .tag-body { fill: #fff; }
.auth-tag .tag-hole { fill: var(--red); }
.auth-tag .tag-text { fill: var(--red); }
.auth-name { font-family: var(--font-display); font-weight: 700; font-size: 72px; line-height: .9; margin: 0; letter-spacing: -.01em; }
.auth-lead { font-size: 18px; max-width: 30ch; margin: 0; opacity: .92; }
.auth-main { display: grid; place-items: center; padding: 40px 24px; background: var(--bg); }
.auth-form { width: min(400px, 100%); display: flex; flex-direction: column; gap: 14px; }
.auth-form h1 { font-size: 48px; }
.auth-form > p { margin: 0; }
.auth-form label { display: flex; flex-direction: column; gap: 5px; font-weight: 600; font-size: 14px; }
.auth-form input { height: 44px; font-size: 16px; }
.auth-submit { height: 46px; font-size: 16px; margin-top: 4px; }
.field-hint { font-size: 13px; font-weight: 400; color: var(--ink-3); margin: 0; }
.menu-toggle {
  display: inline-grid; place-items: center; width: 40px; height: 40px;
  border: 0; border-radius: 6px; background: transparent; color: inherit; cursor: pointer;
}
.mobile-title { font-family: var(--font-display); font-weight: 700; font-size: 22px; }
```

## Shell behaviour — `js/main.js`
### `js/main.js`

```js
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
    document.querySelector('.mobile-title').textContent = master && empresa ? empresa.razaoSocial : 'Escalas 5x2';
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
```
