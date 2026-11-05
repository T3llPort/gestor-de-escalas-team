# Pages — dependency trees

Every view depends on the shell (`index.html`, `js/main.js`), `css/styles.css` and `js/util.js`. Data/logic files are listed for completeness; UI comes from the view file.

## #escala (Escala da semana) — main screen
Entry: `js/schedule.js`
Dependencies:
- `js/util.js` (dates, modal, toast)
- `js/store.js` (data)
- `js/scale.js` (rules, shifts per day, validation)
- `js/print.js` (monthly print)
- `js/csv.js` (export)
- `css/styles.css` (sections: Escala: navegação por semana, ferramentas, opções, grade, Tipo do turno)

## #funcionarios
Entry: `js/employees.js`
- `js/csv.js`, `js/store.js`, `js/util.js`, `css/styles.css`

## #configuracoes
Entry: `js/settings.js`
- `js/store.js`, `js/scale.js`, `js/util.js`, `css/styles.css`

## #historico
Entry: `js/logs.js`
- `js/store.js`, `js/csv.js`, `js/util.js`, `css/styles.css`

## #empresas
Entry: `js/companies.js`
- `js/auth.js`, `js/store.js`, `js/util.js`, `css/styles.css`

## #usuarios
Entry: `js/users.js`
- `js/auth.js`, `js/util.js`, `css/styles.css`

## Login
Entry: `js/login.js`
- `js/auth.js`, `index.html` (#auth-root), `css/styles.css` (Login section)
