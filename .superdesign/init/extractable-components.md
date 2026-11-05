# Extractable components

## Sidebar
- Source: `index.html` (`<aside class="sidebar">`) + `js/main.js` (applyRole, updateSummary)
- Category: layout
- Description: Red vertical sidebar with price-tag "5x2" logo, company picker, icon nav, data group, team summary, user box and theme switch
- Extractable props: activeItem (string, default: "escala"), companyName (string, default: "Supermercado Bom Preço"), alertCount (number, default: 0), employeeCount (number, default: 12)
- Hardcoded: logo SVG, nav labels and stroke icons, theme switch labels, all CSS

## MobileBar
- Source: `index.html` (`<header class="mobile-bar">`)
- Category: layout
- Description: Top bar with menu button shown below 900px
- Extractable props: title (string, default: "Escalas 5x2")
- Hardcoded: hamburger icon, CSS

## PageHead
- Source: pattern in every view (`.page-head` with h1, muted paragraph, `.actions`)
- Category: basic
- Description: Page title, description and right-aligned actions
- Extractable props: title (string), description (string)
- Hardcoded: CSS

## Chip / StatusChip
- Source: `.chip`, `.chip.ok`, `.chip.danger`, `.chip.off` in `css/styles.css`
- Category: basic
- Description: Small status pill (ativo/inativo, semana dentro das regras, alertas)
- Extractable props: variant (string, default: "ok"), label (string)
