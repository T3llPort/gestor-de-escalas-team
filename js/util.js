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
