# Theme

## Part 1 — Token summary

Identity: supermarket red and white. Light theme by default; dark theme via `:root[data-theme="dark"]` and `prefers-color-scheme` ("Sistema"). Print forces light.

### Colors (light → dark)
| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| --red | #c8102e | #e0334d | brand, primary buttons, folga cells, active segmented |
| --red-strong / --red-hover | #9b0c23 | #ff6b7f / #b81f37 | hover, active nav text |
| --red-soft | #fbe7ea | #3a1b21 | soft red fills |
| --bg | #f4f3f3 | #171314 | page background |
| --surface | #ffffff | #211c1d | cards, tables, cells |
| --surface-2 | #f8f7f7 | #282223 | table header, hover |
| --line / --line-strong | #e4e0e1 / #cbc5c6 | #3a3234 / #4f4547 | borders |
| --ink / --ink-2 / --ink-3 | #1e1a1b / #5a5355 / #8a8284 | #f3eeef / #c4babc / #8f8587 | text |
| --side-bg | var(--red) | #1c1617 | sidebar |
| --side-active-bg/fg | #fff / --red-strong | --red / #fff | active nav item |
| --folga-bg/fg | --red / #fff | #d42a44 / #fff | day off cell |
| --ferias-bg/fg | #e3eaf7 / #24467f | #22324f / #a9c3f2 | vacation |
| --afast-bg/fg | #ebe8ea / #4f474a | #332d2f / #cfc5c7 | leave |
| --sun-bg / --sun-head | #fcf1f2 / --red | #2a1e20 / #ff7286 | Sunday column |
| --today-bg | #f0ecea | #332c2e | today column |
| --alert / -line / -bg / -fg | #b86e00 / #e09b00 / #fff1cc / #6b4200 | #f2b23d … / #47340a / #ffd77e | rule alerts (amber) |
| --ok / --ok-bg | #1d7a4c / #e4f3eb | #6fd3a0 / #173527 | success chip |
| shift tags | abertura #fff1c2 / #6b4a00; fechamento #dfe6f7 / #233f7a | same | Abertura/Fechamento badges |

### Type
- `--font-body`: "Barlow", "Segoe UI", system-ui, sans-serif — body 15px / 1.45.
- `--font-display`: "Barlow Condensed" — headings (h1 44px/700, h2 22px, h3 20px), grid times, numbers.

### Shape & layout
- Radius: buttons/inputs 6px, cards 10px, chips 4px, modal 10px (top border 4px red).
- Shadow: `--shadow-pop: 0 18px 48px rgba(40,10,16,.22)` (modals/toasts only); cards are flat with 1px border.
- Sidebar width 252px; container max 1520px, padding 28px 32px.
- Breakpoints: 1200px (single column forms), 900px (sidebar drawer), 760px (login stacks), 640px (compact).
- Grid: name column 220px, day columns min 100px, cells 64px tall.

## Part 2 — Raw source

### `css/styles.css`

```css
/* =========================================================
   Escalas 5x2 — identidade vermelho e branco
   Tokens de cor no :root; tema escuro em [data-theme="dark"]
   e, no modo "Sistema", via prefers-color-scheme.
   ========================================================= */

:root {
  color-scheme: light;

  /* Marca */
  --red: #c8102e;
  --red-strong: #9b0c23;
  --red-hover: #9b0c23;
  --red-soft: #fbe7ea;

  /* Superfícies e texto */
  --bg: #f4f3f3;
  --surface: #ffffff;
  --surface-2: #f8f7f7;
  --line: #e4e0e1;
  --line-strong: #cbc5c6;
  --ink: #1e1a1b;
  --ink-2: #5a5355;
  --ink-3: #8a8284;

  /* Barra lateral */
  --side-bg: var(--red);
  --side-fg: #ffffff;
  --side-muted: rgba(255, 255, 255, .72);
  --side-faint: rgba(255, 255, 255, .5);
  --side-line: rgba(255, 255, 255, .2);
  --side-hover: rgba(255, 255, 255, .12);
  --side-active-bg: #ffffff;
  --side-active-fg: var(--red-strong);
  --side-chip: rgba(255, 255, 255, .16);
  --tag-body: #ffffff;
  --tag-text: var(--red);

  /* Escala */
  --cell-t: var(--ink-3);
  --folga-bg: var(--red);
  --folga-fg: #ffffff;
  --ferias-bg: #e3eaf7;
  --ferias-fg: #24467f;
  --afast-bg: #ebe8ea;
  --afast-fg: #4f474a;
  --sun-bg: #fcf1f2;
  --sun-head: var(--red);
  --today-bg: #f0ecea;

  /* Alertas (âmbar, para não competir com o vermelho da folga) */
  --alert: #b86e00;
  --alert-line: #e09b00;
  --alert-bg: #fff1cc;
  --alert-fg: #6b4200;
  --ok: #1d7a4c;
  --ok-bg: #e4f3eb;

  --focus: var(--red);
  --shadow-pop: 0 18px 48px rgba(40, 10, 16, .22);

  --font-body: "Barlow", "Segoe UI", system-ui, sans-serif;
  --font-display: "Barlow Condensed", "Arial Narrow", "Segoe UI", sans-serif;
  --sidebar-w: 252px;
}

/* Tema escuro: definido manualmente */
:root[data-theme="dark"] {
  color-scheme: dark;
  --red: #e0334d;
  --red-strong: #ff6b7f;
  --red-hover: #b81f37;
  --red-soft: #3a1b21;
  --bg: #171314;
  --surface: #211c1d;
  --surface-2: #282223;
  --line: #3a3234;
  --line-strong: #4f4547;
  --ink: #f3eeef;
  --ink-2: #c4babc;
  --ink-3: #8f8587;
  --side-bg: #1c1617;
  --side-fg: #f3eeef;
  --side-muted: #c4babc;
  --side-faint: #8f8587;
  --side-line: #342c2e;
  --side-hover: #2a2224;
  --side-active-bg: var(--red);
  --side-active-fg: #ffffff;
  --side-chip: #342c2e;
  --tag-body: var(--red);
  --tag-text: #ffffff;
  --folga-bg: #d42a44;
  --ferias-bg: #22324f;
  --ferias-fg: #a9c3f2;
  --afast-bg: #332d2f;
  --afast-fg: #cfc5c7;
  --sun-bg: #2a1e20;
  --sun-head: #ff7286;
  --today-bg: #332c2e;
  --alert: #f2b23d;
  --alert-line: #f2b23d;
  --alert-bg: #47340a;
  --alert-fg: #ffd77e;
  --ok: #6fd3a0;
  --ok-bg: #173527;
  --focus: #ff7286;
  --shadow-pop: 0 18px 48px rgba(0, 0, 0, .5);
}

/* Tema escuro: modo "Sistema" seguindo o computador */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    color-scheme: dark;
    --red: #e0334d;
    --red-strong: #ff6b7f;
    --red-hover: #b81f37;
    --red-soft: #3a1b21;
    --bg: #171314;
    --surface: #211c1d;
    --surface-2: #282223;
    --line: #3a3234;
    --line-strong: #4f4547;
    --ink: #f3eeef;
    --ink-2: #c4babc;
    --ink-3: #8f8587;
    --side-bg: #1c1617;
    --side-fg: #f3eeef;
    --side-muted: #c4babc;
    --side-faint: #8f8587;
    --side-line: #342c2e;
    --side-hover: #2a2224;
    --side-active-bg: var(--red);
    --side-active-fg: #ffffff;
    --side-chip: #342c2e;
    --tag-body: var(--red);
    --tag-text: #ffffff;
    --folga-bg: #d42a44;
    --ferias-bg: #22324f;
    --ferias-fg: #a9c3f2;
    --afast-bg: #332d2f;
    --afast-fg: #cfc5c7;
    --sun-bg: #2a1e20;
    --sun-head: #ff7286;
    --today-bg: #332c2e;
    --alert: #f2b23d;
    --alert-line: #f2b23d;
    --alert-bg: #47340a;
    --alert-fg: #ffd77e;
    --ok: #6fd3a0;
    --ok-bg: #173527;
    --focus: #ff7286;
    --shadow-pop: 0 18px 48px rgba(0, 0, 0, .5);
  }
}

/* ---------- Base ---------- */
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: var(--font-body); font-size: 15px; line-height: 1.45;
}
h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 700; line-height: 1.1; margin: 0; }
h1 { font-size: 44px; letter-spacing: -.01em; }
h2 { font-size: 22px; margin-bottom: 14px; }
h3 { font-size: 20px; }
h4 { font-size: 17px; margin: 18px 0 6px; }
p { margin: 0 0 8px; }
a { color: var(--red); }
.muted { color: var(--ink-2); }
.small { font-size: 13px; }
.mono { font-variant-numeric: tabular-nums; }
.strong { font-weight: 600; }
.text-danger { color: var(--red); }

:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}

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

/* ---------- Escala mensal impressa (só aparece na impressão) ---------- */
#print-root { display: none; }
.pm { color: #000; font-family: var(--font-body); }
.pm-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 3mm; }
.pm-head h1 { font-family: var(--font-display); font-size: 17pt; line-height: 1.1; margin: 0; letter-spacing: 0; }
.pm-head p { margin: 1mm 0 0; font-size: 9pt; }
.pm-meta { text-align: right; color: #444; }
.pm-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.5pt; }
.pm-table col.c-name { width: 44mm; }
.pm-table col.c-shift { width: 30mm; }
.pm-table col.c-total { width: 9mm; }
.pm-table th, .pm-table td { border: 0.3mm solid #9a9a9a; padding: 0.6mm 0.8mm; text-align: center; vertical-align: middle; }
.pm-table thead th { background: #efefef; font-weight: 700; }
.pm-table thead { display: table-header-group; }
.pm-table tr { break-inside: avoid; page-break-inside: avoid; }
.pm-table .pm-name, .pm-table .pm-shift { text-align: left; }
.pm-name strong, .pm-shift strong { display: block; font-size: 7.8pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pm-name span, .pm-shift span { display: block; font-size: 6.5pt; color: #444; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pm-table thead .pm-shift span { white-space: normal; }
.pm-table th.pm-d { font-family: var(--font-display); font-size: 8pt; padding: 0.4mm 0; }
.pm-table th.pm-dow { font-size: 6.5pt; font-weight: 600; }
.pm-table td.pm-d { font-family: var(--font-display); font-weight: 600; padding: 0; height: 6.2mm; }
.pm-table .sun { background: #fbe3e6; }
.pm-table thead th.sun { background: #f3c4cb; color: #8a0b20; }
.pm-table td.v-T { color: #555; font-weight: 500; }
.pm-table td.v-F { background: #c8102e; color: #fff; font-weight: 700; }
.pm-table td.v-FE { background: #dce5f5; color: #24467f; }
.pm-table td.v-AT { background: #e6e2e4; color: #4f474a; }
.pm-table td.pm-total { font-family: var(--font-display); font-weight: 700; font-size: 8.5pt; }
.pm-table td.v-T.ab { background: #fff1c2; color: #6b4a00; font-weight: 700; }
.pm-table td.v-T.fe { background: #dfe6f7; color: #233f7a; font-weight: 700; }
.pm-codes { list-style: none; margin: 2mm 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 1mm 6mm; font-size: 7.5pt; }
.pm-codes li { padding: 0.3mm 1.5mm; border-radius: 1mm; }
.pm-codes li.ab { background: #fff1c2; }
.pm-codes li.fe { background: #dfe6f7; }
.pm-legend { font-size: 7.5pt; margin: 2mm 0 0; }
.pm-adjust { font-size: 7pt; margin-top: 2mm; }
.pm-adjust ul { margin: 1mm 0 0; padding-left: 4mm; columns: 3; column-gap: 6mm; }
.pm-sign { display: flex; gap: 20mm; margin-top: 12mm; font-size: 8pt; break-inside: avoid; }
.pm-sign span { flex: 0 0 70mm; border-top: 0.3mm solid #000; padding-top: 1mm; }
.pm-sign span:last-child { flex-basis: 40mm; }

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

/* ---------- Área principal ---------- */
.container { max-width: 1520px; margin-left: var(--sidebar-w); padding: 28px 32px 40px; }

.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.page-head h1 { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.page-head h1 .year { font-weight: 500; color: var(--ink-3); }
.page-head p { margin: 6px 0 0; max-width: 72ch; }
.actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* ---------- Componentes ---------- */
.panel, .card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 38px; padding: 0 16px; border-radius: 6px;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink);
  font: inherit; font-weight: 600; cursor: pointer; white-space: nowrap; text-decoration: none;
}
.btn:hover { border-color: var(--ink-3); background: var(--surface-2); }
.btn.primary { background: var(--red); border-color: var(--red); color: #fff; }
.btn.primary:hover { background: var(--red-hover); border-color: var(--red-hover); }
.btn.danger { background: var(--surface); border-color: var(--red); color: var(--red); }
.btn.danger:hover { background: var(--red); color: #fff; }
.file-btn { position: relative; }
.icon-btn {
  display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 6px;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink);
  cursor: pointer; font-size: 20px; line-height: 1;
}
.icon-btn:hover { background: var(--surface-2); }
.link { background: none; border: 0; color: var(--ink); cursor: pointer; font: inherit; font-weight: 600; padding: 4px 6px; border-radius: 4px; }
.link:hover { color: var(--red); text-decoration: underline; }
.link.danger { color: var(--red); }

input, select {
  height: 38px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: 6px;
  font: inherit; color: var(--ink); background: var(--surface); min-width: 0;
}
input::placeholder { color: var(--ink-3); }
input:focus, select:focus { outline: 2px solid var(--focus); outline-offset: 0; border-color: transparent; }

.empty { padding: 44px 20px; text-align: center; color: var(--ink-2); }
.empty.big { padding: 64px 24px; }
.empty.big p:first-child { font-family: var(--font-display); font-weight: 700; font-size: 26px; color: var(--ink); }
.empty .btn { margin-top: 12px; }

/* ---------- Funcionários ---------- */
.layout-2 { display: grid; grid-template-columns: 360px 1fr; gap: 24px; align-items: start; }
.form { padding: 22px; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 24px; border-top: 4px solid var(--red); }
.form h2 { margin: 0; }
.form label { display: flex; flex-direction: column; gap: 5px; font-weight: 600; font-size: 14px; }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.form-error { color: var(--alert-fg); background: var(--alert-bg); border-left: 3px solid var(--alert-line); padding: 8px 12px; border-radius: 4px; margin: 0; }
.hint { font-size: 14px; color: var(--ink-2); border-top: 1px solid var(--line); padding-top: 14px; margin: 2px 0 0; }

.list-card { overflow: hidden; }
.list-tools { padding: 14px 16px; border-bottom: 1px solid var(--line); }
.list-tools input { width: 100%; max-width: 380px; }
.table-wrap { overflow-x: auto; }
.table-wrap.small { max-height: 270px; overflow: auto; border: 1px solid var(--line); border-radius: 6px; margin: 12px 0; }
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left; font-size: 14px; font-weight: 600; color: var(--ink-2);
  background: var(--surface-2); position: sticky; top: 0;
}
.table th, .table td { padding: 11px 16px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.table.compact th, .table.compact td { padding: 7px 12px; }
.table tbody tr:hover td { background: var(--surface-2); }
.table tr.selected td { background: var(--red-soft); }
.row-actions { text-align: right; }
.sex-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; color: var(--ink-2); }
.sex-badge::before { font-size: 15px; color: var(--ink); }
.sex-badge.M::before { content: "♂"; }
.sex-badge.F::before { content: "♀"; }
.error-list { margin: 0; padding-left: 18px; max-height: 190px; overflow: auto; color: var(--alert-fg); }

/* ---------- Escala: navegação por semana ---------- */
.week-nav .icon-btn { width: 40px; height: 38px; font-size: 24px; }
.week-nav input[type="date"] { width: 150px; }
.btn:disabled { opacity: .45; cursor: default; }
.btn:disabled:hover { background: var(--surface); border-color: var(--line-strong); }

/* ---------- Escala: ferramentas ---------- */
.toolbar { display: flex; flex-wrap: wrap; gap: 12px 20px; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.tool-group { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.brushes { padding: 3px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); gap: 2px; }
.brush {
  display: inline-flex; align-items: center; gap: 7px;
  height: 32px; padding: 0 12px; border: 0; border-radius: 5px; background: transparent;
  font: inherit; font-size: 14px; font-weight: 500; color: var(--ink-2); cursor: pointer;
}
.brush::before { content: ""; width: 12px; height: 12px; border-radius: 3px; border: 1px solid var(--line-strong); }
.brush.b-toggle::before { background: linear-gradient(135deg, var(--surface) 50%, var(--folga-bg) 50%); }
.brush.b-FE::before { background: var(--ferias-bg); border-color: var(--ferias-fg); }
.brush.b-AT::before { background: var(--afast-bg); border-color: var(--afast-fg); }
.brush.b-T::before { background: var(--surface); }
.brush:hover { color: var(--ink); background: var(--surface-2); }
.brush.active { background: var(--ink); color: var(--surface); font-weight: 600; }

.status-line { display: flex; align-items: center; gap: 10px 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 14px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 4px;
  background: var(--surface); border: 1px solid var(--line); font-weight: 600; text-decoration: none; color: var(--ink);
}
.chip.ok { background: var(--ok-bg); border-color: transparent; color: var(--ok); }
.chip.ok::before { content: "✓"; }
.chip.danger { background: var(--alert-bg); border-color: var(--alert-line); color: var(--alert-fg); }
.chip.danger::before { content: "!"; font-weight: 800; }
.chip.off { background: var(--surface-2); color: var(--ink-3); }
.role-badge { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 13px; font-weight: 600; border: 1px solid var(--line-strong); }
.role-badge.r-master { background: var(--ink); color: var(--surface); border-color: var(--ink); }
.role-badge.r-gerente { background: var(--red-soft); color: var(--red); border-color: transparent; }
.list-tools { padding: 12px 18px; border-bottom: 1px solid var(--line); }
.list-tools input { width: min(360px, 100%); }
.inline-filter { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--ink-2); }
.inline-filter select { max-width: 260px; }
.role-desc { margin: -4px 0 0; padding: 8px 12px; border-radius: 6px; background: var(--surface-2); font-size: 14px; color: var(--ink-2); }
.form-grid select { width: 100%; }
.legend { margin-left: auto; display: flex; align-items: center; gap: 4px 14px; color: var(--ink-2); flex-wrap: wrap; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.lg {
  display: inline-grid; place-items: center; width: 26px; height: 22px; border-radius: 3px;
  font-family: var(--font-display); font-size: 13px; font-weight: 700;
  border: 1px solid var(--line); background: var(--surface);
}
.lg.sun { background: var(--sun-bg); color: var(--sun-head); }

/* ---------- Escala: opções de horário e limite de folgas ---------- */
.options-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 32px; padding: 12px 16px; margin-bottom: 14px; }
.opt { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font-size: 14px; }
.opt-label { font-weight: 600; color: var(--ink-2); }
.opt-input { display: inline-flex; align-items: center; gap: 8px; }
.opt-input input { width: 104px; height: 34px; font-family: var(--font-display); font-size: 17px; font-weight: 600; }
.segmented { display: inline-flex; padding: 3px; gap: 2px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--line); }
.segmented button {
  height: 30px; padding: 0 12px; border: 0; border-radius: 5px; background: transparent; cursor: pointer;
  font: inherit; font-size: 14px; font-weight: 500; color: var(--ink-2);
}
.btn.small-btn { height: 32px; padding: 0 12px; font-size: 14px; }
.segmented button:hover { color: var(--ink); background: var(--surface); }
.segmented button.active { background: var(--red); color: #fff; font-weight: 600; }

/* ---------- Escala: grade ---------- */
.grid-wrap { overflow: auto; max-height: calc(100vh - 250px); min-height: 260px; }
/* Os dias ocupam toda a largura disponível; abaixo da largura mínima a grade rola na horizontal. */
.grid { --name-w: 220px; --day-w: 100px; width: 100%; min-width: calc(var(--name-w) + 7 * var(--day-w)); border-collapse: separate; border-spacing: 0; user-select: none; font-family: var(--font-display); font-size: 15px; table-layout: fixed; }
.grid th, .grid td { border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); text-align: center; padding: 0; }
.grid thead th { position: sticky; top: 0; z-index: 3; background: var(--surface); height: 56px; border-bottom: 2px solid var(--line-strong); }
.dh-dow { display: block; font-size: 19px; font-weight: 700; line-height: 1.1; }
.dh-date { display: block; font-size: 14px; font-weight: 500; color: var(--ink-3); }
.dh-over {
  display: block; margin: 2px auto 3px; width: fit-content; padding: 0 6px; border-radius: 3px;
  background: var(--alert-line); color: #2b1b00; font-size: 12px; font-weight: 700; line-height: 17px;
}
.grid thead th.sun { color: var(--sun-head); background: var(--sun-bg); }
.grid thead th.sun .dh-date { color: var(--sun-head); }
.grid thead th.today { background: var(--ink); color: var(--surface); }
.grid thead th.today .dh-date { color: var(--surface); }
.grid .name-col {
  position: sticky; left: 0; z-index: 2; background: var(--surface); text-align: left;
  width: var(--name-w); padding: 0;
  font-family: var(--font-body); font-size: 14px; font-weight: 500;
  border-right: 2px solid var(--line-strong);
}
.grid thead .name-col { z-index: 4; padding: 0 14px; font-size: 14px; font-weight: 600; color: var(--ink-2); }

/* Nome do funcionário: abre a escolha da escala de horário */
.emp-btn {
  display: flex; flex-direction: column; gap: 2px; width: 100%; min-height: 64px; padding: 8px 14px;
  border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.emp-btn:hover { background: var(--surface-2); }
.emp-btn:hover .emp-name { color: var(--red); }
.emp-btn:focus-visible { outline-offset: -2px; }
.emp-line { display: flex; align-items: center; min-width: 0; }
.emp-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-shift { padding-left: 22px; font-size: 13px; color: var(--red); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-hours { color: var(--ink-3); font-weight: 500; }
.emp-shift.none { color: var(--ink-3); font-weight: 500; text-decoration: underline dotted; text-underline-offset: 3px; }
.sex-dot { display: inline-block; flex: none; width: 16px; margin-right: 6px; text-align: center; color: var(--ink-3); font-size: 14px; }
.sex-dot.M::before { content: "♂"; }
.sex-dot.F::before { content: "♀"; }

.cell {
  height: 64px; padding: 5px 6px; cursor: pointer; vertical-align: middle;
  font-weight: 600; position: relative; background: var(--surface);
}
.cell .c-main { display: block; font-size: 17px; line-height: 1.2; white-space: nowrap; }
/* Dia de trabalho: em cima entrada–saída para almoço, embaixo volta do almoço–encerramento */
.cell .c-time { display: block; font-size: 18px; line-height: 1.25; white-space: nowrap; }
.cell .c-time.out { color: var(--ink-2); }
.cell .tm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 0 6px; }
.cell input.tm {
  display: block; width: 100%; min-width: 0; height: 25px; margin: 0; padding: 0 2px;
  border: 1px solid var(--line); border-radius: 3px; background: var(--surface); color: var(--ink);
  font-family: var(--font-display); font-size: 14px; font-weight: 600; text-align: center; cursor: text;
}
.cell input.tm::-webkit-datetime-edit { padding: 0; }
.cell input.tm::-webkit-datetime-edit-fields-wrapper { padding: 0; }
.cell input.tm:focus { border-color: var(--red); outline: none; box-shadow: 0 0 0 2px var(--red-soft); }
.cell input.tm.custom { border-color: var(--red); color: var(--red); }
.cell input.tm::-webkit-calendar-picker-indicator { display: none; }
.cell:hover { outline: 2px solid var(--ink); outline-offset: -2px; z-index: 1; }
.cell.sun { background: var(--sun-bg); }
.lg.s-T { color: var(--cell-t); font-weight: 500; }
.cell.s-T { color: var(--ink); }
/* Folga: carimbo vermelho */
.cell.s-F, .lg.s-F { background: var(--folga-bg); color: var(--folga-fg); font-weight: 700; }
.cell.s-FE, .lg.s-FE { background: var(--ferias-bg); color: var(--ferias-fg); }
.cell.s-AT, .lg.s-AT { background: var(--afast-bg); color: var(--afast-fg); }
.cell.warn { box-shadow: inset 0 -4px 0 var(--alert-line); }
.cell.err { background: var(--alert-bg); color: var(--alert-fg); box-shadow: inset 0 0 0 2px var(--alert-line); font-weight: 700; }
/* Dia atual: a coluna inteira fica emoldurada e com fundo próprio, nos horários automáticos e manuais. */
.cell.today { box-shadow: inset 3px 0 0 var(--ink), inset -3px 0 0 var(--ink); }
.cell.today.s-T, .cell.today.s-none { background: var(--today-bg); }
.cell.today input.tm { border-color: var(--line-strong); }
.cell.today.warn { box-shadow: inset 3px 0 0 var(--ink), inset -3px 0 0 var(--ink), inset 0 -4px 0 var(--alert-line); }
.cell.today.err { background: var(--alert-bg); box-shadow: inset 3px 0 0 var(--ink), inset -3px 0 0 var(--ink), inset 0 0 0 5px var(--alert-line); }
.grid tbody tr:last-child .cell.today { box-shadow: inset 3px 0 0 var(--ink), inset -3px 0 0 var(--ink), inset 0 -3px 0 var(--ink); }

/* ---------- Escolha da escala do funcionário ---------- */
.shift-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.shift-option {
  display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; cursor: pointer;
  border: 1px solid var(--line-strong); border-radius: 8px;
}
.shift-option:hover { background: var(--surface-2); }
.shift-option:has(input:checked) { border-color: var(--red); background: var(--red-soft); }
.shift-option input { height: auto; margin-top: 3px; accent-color: var(--red); }
.so-text { display: flex; flex-direction: column; gap: 1px; }
.so-text strong { font-family: var(--font-display); font-size: 18px; }
.so-text .muted { font-size: 14px; }

/* ---------- Configurações ---------- */
.section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--line); }
.section-head h2 { margin: 0; }
.list-card + .list-card { margin-top: 18px; }
.rules-body { padding: 16px 18px; }
.rules-body p { margin: 10px 0 0; max-width: 72ch; }
.shifts-table td.mono { font-family: var(--font-display); font-size: 17px; font-weight: 600; }
.warn-dot {
  display: inline-grid; place-items: center; width: 18px; height: 18px; margin-left: 6px; border-radius: 50%;
  background: var(--alert-line); color: #2b1b00; font-family: var(--font-body); font-size: 12px; font-weight: 800; cursor: help;
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid label { display: flex; flex-direction: column; gap: 5px; font-weight: 600; font-size: 14px; }
.form-grid input[type="time"] { font-family: var(--font-display); font-size: 18px; font-weight: 600; }
.span-2 { grid-column: 1 / -1; }
.shift-preview { padding: 10px 14px; border-radius: 6px; background: var(--surface-2); border-left: 3px solid var(--line-strong); font-size: 14px; }
.shift-preview.ok { border-left-color: var(--ok); }
.shift-preview.has-warn { background: var(--alert-bg); border-left-color: var(--alert-line); }
.preview-total strong { font-family: var(--font-display); font-size: 20px; }
.preview-warn { color: var(--alert-fg); margin-top: 4px; }

.alerts { padding: 18px 22px; margin-top: 18px; border-left: 4px solid var(--alert-line); }
.alerts ul { margin: 0; padding-left: 18px; columns: 2; column-gap: 36px; }
.alerts li { margin-bottom: 6px; break-inside: avoid; }
.alerts li::marker { color: var(--alert); }
.print-title { display: none; }

/* ---------- Modal e avisos ---------- */
.modal-backdrop { position: fixed; inset: 0; background: rgba(20, 8, 11, .5); display: grid; place-items: center; z-index: 100; padding: 16px; }
.modal {
  background: var(--surface); color: var(--ink); border-radius: 10px; width: min(720px, 100%);
  max-height: calc(100vh - 32px); display: flex; flex-direction: column;
  box-shadow: var(--shadow-pop); border-top: 4px solid var(--red);
}
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid var(--line); }
.modal-head .icon-btn { border: 0; }
.modal-body { padding: 18px 22px; overflow: auto; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid var(--line); }
.radio-list { display: flex; flex-direction: column; gap: 10px; margin: 14px 0; }
.radio-list label { display: flex; gap: 10px; align-items: center; cursor: pointer; }
.radio-list input { height: auto; accent-color: var(--red); }

.toasts { position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 200; max-width: min(420px, calc(100vw - 40px)); }
.toast {
  padding: 12px 16px; border-radius: 6px; background: var(--ink); color: var(--surface);
  box-shadow: var(--shadow-pop); border-left: 4px solid var(--ink-3);
  transition: opacity .35s, transform .35s;
}
.toast.success { border-left-color: var(--ok); }
.toast.error { border-left-color: var(--red); }
.toast.hide { opacity: 0; transform: translateY(8px); }

/* ---------- Responsivo ---------- */
@media (max-width: 1200px) {
  .layout-2 { grid-template-columns: 1fr; }
  .form { position: static; }
  .alerts ul { columns: 1; }
  .legend { margin-left: 0; }
}
/* Em telas pequenas a barra lateral vira um menu deslizante. */
@media (max-width: 900px) {
  .mobile-bar {
    position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 8px;
    height: 56px; padding: 0 12px; background: var(--side-bg); color: var(--side-fg);
  }
  .sidebar { transform: translateX(-100%); transition: transform .2s ease; }
  body.nav-open .sidebar { transform: none; box-shadow: var(--shadow-pop); }
  body.nav-open .sidebar-backdrop { display: block; position: fixed; inset: 0; z-index: 25; background: rgba(20, 8, 11, .5); }
  .container { margin-left: 0; padding: 22px 20px 32px; }
  .grid-wrap { max-height: calc(100vh - 300px); }
  h1 { font-size: 36px; }
}
@media (max-width: 760px) {
  .auth { grid-template-columns: 1fr; min-height: 0; }
  .auth-side { padding: 20px 16px; flex-direction: row; justify-content: flex-start; align-items: center; gap: 14px; }
  .auth-tag { width: 66px; height: 40px; margin: 0; }
  .auth-name { font-size: 40px; }
  .auth-lead { display: none; }
  .auth-main { padding: 28px 16px; place-items: start center; }
}
@media (max-width: 640px) {
  .container { padding: 18px 16px 28px; }
  .grid { --name-w: 170px; }
  .options-bar { gap: 12px; }
  .row-2, .form-grid { grid-template-columns: 1fr; }
  .week-nav input[type="date"] { width: 100%; }
}

/* ---------- Impressão (sempre clara) ---------- */
@media print {
  @page { size: A4 landscape; margin: 8mm; }
  /* :not(#impressao) eleva a especificidade acima das regras do tema escuro. */
  :root:not(#impressao) {
    color-scheme: light;
    --bg: #fff; --surface: #fff; --surface-2: #f6f6f6; --line: #cfcfcf; --line-strong: #999;
    --ink: #000; --ink-2: #333; --ink-3: #666; --cell-t: #666;
    --folga-bg: #c8102e; --folga-fg: #fff; --sun-bg: #fcf1f2; --sun-head: #c8102e;
    --ferias-bg: #e3eaf7; --ferias-fg: #24467f; --afast-bg: #ebe8ea; --afast-fg: #4f474a;
    --alert-bg: #fff1cc; --alert-fg: #6b4200;
  }
  body { background: #fff; color: #000; }
  .sidebar, .mobile-bar, .sidebar-backdrop, .page-head, .toolbar, .options-bar, .status-line, .alerts, .toasts { display: none !important; }
  .cell input.tm { border: 0; height: 16px; font-size: 12px; color: #000; }
  .container { padding: 0; margin: 0; max-width: none; }
  .print-title { display: block; font-family: var(--font-display); font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .card { border: 0; }
  .grid-wrap { overflow: visible; max-height: none; }
  .grid { width: 100%; min-width: 0; font-size: 12px; }
  .cell .c-time { font-size: 12px; }
  .grid-wrap { width: auto; }
  .grid thead th, .grid .name-col { position: static; }
  .grid .name-col { width: 200px; }
  .emp-btn { min-height: 0; padding: 4px 8px; }
  .cell { height: 40px; }
  .cell .c-main { font-size: 13px; }
  .cell.err, .cell.warn { box-shadow: none; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* Escala mensal: no lugar da tela, imprime só a folha do mês. */
  body.printing-month #view { display: none !important; }
  body.printing-month #print-root { display: block; }
}
```
