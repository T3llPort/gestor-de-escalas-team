# Routes

Stack: vanilla HTML/CSS/JS SPA (no framework, no build step, no package.json). Classic scripts share a global `window.App` namespace.
Views render HTML strings with template literals into `<main id="view">`. Styling is a single hand-written `css/styles.css` with CSS custom properties (no Tailwind).
Fonts: Barlow (body) + Barlow Condensed (display) from Google Fonts. Icons are inline SVG (stroke icons, 24px viewBox). Language: pt-BR.

Hash routing in `js/main.js` (`ROUTES` map + `hashchange`). Access per role in `js/auth.js` (`ROTAS`): master = all; gerente = escala, funcionarios, configuracoes, historico, usuarios; operador = escala, funcionarios. Not logged in → login screen (`js/login.js`).

| Hash | View file | What it renders |
| --- | --- | --- |
| (login) | `js/login.js` | Email/password login. Red brand panel + form. |
| `#escala` | `js/schedule.js` | "Escala da semana": week title + arrows/date nav; toolbar (search, edit brushes Trabalho ou folga/Férias/Afastamento/Marcar trabalho, Regenerar/Exportar CSV/Imprimir); options bar (Horários do dia segmented Automático/Manual + Redistribuir horários; folga limit summary); status chips + legend; the main grid (sticky name column with employee name + "Rodízio"/fixed shift; 7 day columns; each work cell shows Abertura/Fechamento tag + "07:00–11:00 / 12:00–16:24"; folga cells solid red; today column framed); alert list. |
| `#funcionarios` | `js/employees.js` | Two-column: registration form card (nome, CPF, sexo, nascimento, departamento, cargo) + searchable table of employees; CSV import modal. |
| `#configuracoes` | `js/settings.js` | Shift types table (Escala, Tipo badge, 4 times, jornada, fixos, actions) with "Adicionar escala" modal (times + Abertura/Fechamento checkboxes, live preview); per-department folga limit table. |
| `#historico` | `js/logs.js` | Audit log: filters (De/Até/Alteração/Busca) + table (Quando, Usuário, Alteração, Funcionário, Dia, Antes, Depois) + Exportar CSV. |
| `#empresas` | `js/companies.js` | Companies table (Razão social, CNPJ, Usuários, Funcionários, Acesso chip, actions) + modal form. |
| `#usuarios` | `js/users.js` | Users table (Nome, E-mail, Papel badge, Empresa, Acesso, actions) with company filter + modal form. |

Print: `js/print.js` builds a monthly A4-landscape sheet into `#print-root`.

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
```
