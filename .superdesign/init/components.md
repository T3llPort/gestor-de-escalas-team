# Components

Stack: vanilla HTML/CSS/JS SPA (no framework, no build step, no package.json). Classic scripts share a global `window.App` namespace.
Views render HTML strings with template literals into `<main id="view">`. Styling is a single hand-written `css/styles.css` with CSS custom properties (no Tailwind).
Fonts: Barlow (body) + Barlow Condensed (display) from Google Fonts. Icons are inline SVG (stroke icons, 24px viewBox). Language: pt-BR.

There is no component library. Shared UI primitives are CSS classes in `css/styles.css` used inside template-literal HTML, plus the modal/toast helpers in `js/util.js`.

## Primitives (CSS) — `css/styles.css`

Button: `.btn`, `.btn.primary` (red), `.btn.danger`, `.btn.small-btn`, `.icon-btn`, `.link` / `.link.danger`.
Card/panel: `.card`, `.panel`, `.list-card`, `.section-head`.
Inputs: `input, select` (38px, 6px radius), `.form`, `.form-grid`, `.field-block`, `.form-error`, `.check-group`.
Table: `.table`, `.table.compact`, `.table-wrap`, `.row-actions`.
Chips/badges: `.chip`, `.chip.ok`, `.chip.danger`, `.chip.off`, `.nav-badge`, `.role-badge`, `.shift-type`, `.sex-badge`.
Segmented control: `.segmented` (buttons, `.active` = red fill). Brushes toolbar: `.brushes .brush`.
Modal: `.modal-backdrop .modal .modal-head/.modal-body/.modal-foot` (built by `App.util.modal`). Toast: `.toasts .toast`.
Empty state: `.empty`, `.empty.big`.

```css
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
```

## Modal / toast helpers — `js/util.js`

### `js/util.js`

```js
/* Utilitários gerais: datas, CPF, formatação e componentes simples de UI. */
window.App = window.App || {};

(function (App) {
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const DIAS_NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // ---------- Datas (sempre no fuso local, chave no formato AAAA-MM-DD) ----------
  function pad(n) { return String(n).padStart(2, '0'); }

  function toKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  // Segunda-feira da semana que contém a data (semana de segunda a domingo).
  function mondayOf(d) {
    const dow = d.getDay();
    return addDays(d, dow === 0 ? -6 : 1 - dow);
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Índice absoluto de semanas, usado para manter o ciclo de domingos contínuo entre anos.
  function weekIndex(d) {
    const ref = new Date(2024, 0, 1); // uma segunda-feira
    return Math.round((mondayOf(d) - ref) / (7 * 86400000));
  }

  function formatDateBR(key) {
    if (!key) return '';
    const [y, m, d] = key.split('-');
    return d + '/' + m + '/' + y;
  }

  // Aceita dd/mm/aaaa, dd-mm-aaaa, aaaa-mm-dd. Retorna AAAA-MM-DD ou null.
  function parseDateFlexible(s) {
    s = String(s || '').trim();
    let y, m, d, mt;
    if ((mt = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) {
      d = +mt[1]; m = +mt[2]; y = +mt[3];
    } else if ((mt = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) {
      y = +mt[1]; m = +mt[2]; d = +mt[3];
    } else {
      return null;
    }
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return toKey(dt);
  }

  function age(key) {
    if (!key) return '';
    const b = fromKey(key);
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
    return a;
  }

  // ---------- CPF ----------
  function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }

  function isValidCPF(value) {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    for (let t = 9; t < 11; t++) {
      let sum = 0;
      for (let i = 0; i < t; i++) sum += Number(cpf[i]) * (t + 1 - i);
      const dv = ((sum * 10) % 11) % 10;
      if (dv !== Number(cpf[t])) return false;
    }
    return true;
  }

  function formatCPF(value) {
    const c = onlyDigits(value).slice(0, 11);
    return c
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  // ---------- CNPJ ----------
  function isValidCNPJ(value) {
    const c = onlyDigits(value);
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    const dv = (len) => {
      let sum = 0, peso = len - 7;
      for (let i = 0; i < len; i++) {
        sum += Number(c[i]) * peso--;
        if (peso < 2) peso = 9;
      }
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
  }

  function formatCNPJ(value) {
    const c = onlyDigits(value).slice(0, 14);
    return c
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  // ---------- Texto ----------
  function normalize(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function plural(n, singular, pluralForm) {
    return n === 1 ? singular : pluralForm;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- UI: toast e modal ----------
  function toast(msg, type) {
    const host = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.classList.add('hide'), 3800);
    setTimeout(() => el.remove(), 4300);
  }

  // Abre um modal. `buttons`: [{label, value, kind}]. Resolve com o value do botão clicado (ou null).
  function modal({ title, body, buttons, onOpen }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><h3></h3><button class="icon-btn" data-close aria-label="Fechar">×</button></div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-foot"></div></div>';
      backdrop.querySelector('h3').textContent = title;
      const bodyEl = backdrop.querySelector('.modal-body');
      if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
      const foot = backdrop.querySelector('.modal-foot');
      (buttons || [{ label: 'OK', value: true, kind: 'primary' }]).forEach((b) => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.kind || '');
        btn.textContent = b.label;
        btn.addEventListener('click', () => {
          if (b.validate && !b.validate(backdrop)) return;
          close(b.value);
        });
        foot.appendChild(btn);
      });
      function close(v) {
        document.removeEventListener('keydown', onKey);
        backdrop.remove();
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') close(null); }
      backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(null); });
      backdrop.querySelector('[data-close]').addEventListener('click', () => close(null));
      document.addEventListener('keydown', onKey);
      document.body.appendChild(backdrop);
      if (onOpen) onOpen(backdrop);
    });
  }

  function confirmDialog(title, message, okLabel, danger) {
    return modal({
      title,
      body: '<p>' + message + '</p>',
      buttons: [
        { label: 'Cancelar', value: false },
        { label: okLabel || 'Confirmar', value: true, kind: danger ? 'danger' : 'primary' }
      ]
    }).then((v) => v === true);
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  App.util = {
    MESES, DIAS_CURTOS, DIAS_NOMES,
    pad, toKey, fromKey, addDays, mondayOf, daysInMonth, weekIndex,
    formatDateBR, parseDateFlexible, age,
    onlyDigits, isValidCPF, formatCPF, isValidCNPJ, formatCNPJ,
    normalize, escapeHtml, plural, uid,
    toast, modal, confirmDialog, downloadFile
  };
})(window.App);
```
