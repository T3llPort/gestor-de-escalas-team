/* Tela de login (e-mail e senha). Os acessos são cadastrados fora desta tela. */
(function (App) {
  const U = App.util;
  const A = App.auth;
  const esc = U.escapeHtml;

  // `onSuccess` é chamado depois de entrar; `mensagem` aparece acima do formulário (ex.: acesso inativado).
  function render(root, { onSuccess, mensagem }) {
    root.innerHTML = `
      <div class="auth">
        <section class="auth-side" aria-hidden="true">
          <p class="auth-name">Gestor de Escalas <span>Team</span></p>
          <p class="auth-lead">Folgas, domingos e horários da equipe do supermercado, semana a semana.</p>
          <p class="dev-mark">Desenvolvido por <img src="img/fourtech-logo.png" alt="FourTech"></p>
        </section>

        <section class="auth-main">
          <form class="auth-form" id="auth-form" novalidate>
            <h1>Entrar</h1>
            <p class="muted">Use o e-mail e a senha cadastrados para você.</p>
            <label>E-mail
              <input name="email" type="email" autocomplete="username" maxlength="120" required>
            </label>
            <label>Senha
              <input name="senha" type="password" autocomplete="current-password" required>
            </label>
            <p class="form-error" id="auth-error" ${mensagem ? '' : 'hidden'}>${esc(mensagem || '')}</p>
            <button class="btn primary auth-submit" type="submit">Entrar</button>
            <p class="small muted">Esqueceu a senha? Peça ao gerente da sua empresa ou ao master da plataforma para cadastrar uma nova.</p>
          </form>
        </section>
      </div>`;

    const form = root.querySelector('#auth-form');
    const errEl = root.querySelector('#auth-error');
    const btn = form.querySelector('.auth-submit');
    const field = (n) => form.querySelector(`[name="${n}"]`);
    field('email').focus();

    function showError(msg, input) {
      errEl.textContent = msg;
      errEl.hidden = false;
      if (input) input.focus();
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      errEl.hidden = true;
      const email = field('email').value.trim();
      const senha = field('senha').value;
      if (!email || !senha) {
        return showError('Informe o e-mail e a senha.', !email ? field('email') : field('senha'));
      }

      // O cálculo da senha leva uma fração de segundo: mostra que está trabalhando antes.
      btn.disabled = true;
      btn.textContent = 'Entrando…';
      setTimeout(() => {
        const r = A.login(email, senha);
        if (r.erro) {
          btn.disabled = false;
          btn.textContent = 'Entrar';
          field('senha').value = '';
          showError(r.erro, field('senha'));
          return;
        }
        onSuccess();
      }, 30);
    });
  }

  App.loginView = { render };
})(window.App);
