# Escalas 5x2 — Design System (identidade FourTech)

## Product context
Web system (pt-BR) by FourTech for supermarket managers to build and adjust the 5x2 work schedules of their employees.
Users: store managers (gerente), operators (operador) and the platform admin (master). Desktop back-office use, long
sessions; the monthly schedule is printed for the wall.

Key pages: Escala da semana (main: week grid of employees × days), Funcionários (registration + CSV import),
Configurações (shift types with opening/closing flags, per-department folga limits), Histórico (audit log),
Empresas and Usuários (admin), Login.

Jobs to be done: see who works/rests each day at a glance; spot rule alerts (Sundays, 11h rest, 42h week,
department folga limits); quickly toggle a day between work and folga; see who opens and who closes the store;
print the month.

Domain vocabulary (keep exactly): Escala da semana, Folga, Folga do domingo, Férias, Afastamento, Trabalho,
Abertura, Fechamento, Rodízio, Fixo, Regenerar, Redistribuir horários, Exportar CSV, Imprimir, Esta semana,
Horários do dia (Automático pela escala / Manual, dia a dia), Departamento, Cargo, Alertas de regra.

## Visual direction — FourTech "circuit-trace" style (adopted from fourtechsolucoes.com.br)
Corporate-technical, deep navy plus one electric blue. Navy surfaces carry a faint circuit-board linework texture
(thin right-angle traces with small circle nodes, low opacity) — the brand's signature graphic. White work areas
stay clean and dense for the schedule grid. Hierarchy comes from navy/white contrast and type weight, not from
decoration. Square-cornered structure; rounding only on small interactive controls.

## Color (no other hues)
- Navy `#011E4F` — sidebar, dark bands/headers, solid **Folga** cells, headings on white.
- Deepest navy `#010F2E` — darkest surface (sidebar footer zone, dark theme base).
- Navy 2 `#062A6B` — hover/raised navy.
- Electric blue `#0173FE` — the single accent: primary buttons, active nav item, active segmented option, links,
  today marker, focus ring. Hover `#0563E0`. Light blue `#299BFE` for accents on navy (numbers, highlights).
- Ink on white: headings `#011E4F`, body `#3D4B6B`, muted `#6B7A99`.
- Text on navy: white `#FFFFFF`, secondary `#B3C3E3`, faint `#97A8CC`.
- Lines `#DCE4F0`; pale fills `#EAF0F9` / `#F4F7FC` (table header, hover, Sunday column).
- Schedule semantics:
  - Folga: solid navy `#011E4F` block, white bold "Folga" (sub-label "do domingo" in `#B3C3E3`).
  - Férias: `#EAF0F9` bg / `#0A5FD6` text. Afastamento: `#F1F3F7` bg / `#3D4B6B` text.
  - Abertura tag: blue tint `#E3EEFF` / `#0563E0`. Fechamento tag: navy tint `#DCE4F0` / `#011E4F`.
  - Sunday column tint `#F4F7FC`, header text `#0173FE`. Today column: 3px `#0173FE` top marker + `#EAF0F9` tint.
  - Rule alerts stay amber for meaning (`#B86E00`, bg `#FFF4D6`); success green `#1D7A4C` on `#E4F3EB`. Use sparingly.

## Typography
- Display / headings / numbers: **Sora** (600/700), tight tracking (-0.5px to -1.2px at large sizes). Page title ~34–40px/700.
- Body / UI / tables: **IBM Plex Sans** (400/500/600), 14–15px / 1.5.
- Times in cells and counters may use Sora 600 or IBM Plex Sans 600 with tabular numbers.
- Sentence case. No all-caps labels.

## Shape, spacing, elevation
- Cards, panels, tables, sidebar: **0px radius** (square). Buttons/inputs/segmented: 8px. Tags/chips: 6px. Circular only for avatars/badges.
- Cards on white: 1px `#DCE4F0` border; large soft shadow only on prominent panels: `0 20px 40px -28px rgba(1,30,79,.5)`.
- Buttons: primary = `#0173FE` fill, white text, 8px radius, 40px height, inset highlight `inset 0 1px 0 rgba(255,255,255,.18)` + `0 1px 2px rgba(1,30,79,.25)`; secondary = transparent with `#DCE4F0` border and navy text; on navy, ghost border `rgba(255,255,255,.3)`.
- 8px spacing rhythm; page padding 28–32px; sidebar 260px.
- Motion: 0.15s cubic-bezier(0.4,0,0.2,1) for color/border; 0.2s for transforms. Respect reduced motion.

## Brand
- Product name: **Gestor de Escalas Team** (Sora 700, "Team" in light blue #299BFE) at the top of the sidebar, with the
  company name below, and on the login panel.
- FourTech appears only as a discreet development watermark: "Desenvolvido por" + small FourTech logo (light lockup,
  ~14–16px tall, ~70% opacity) at the bottom of the sidebar and of the login's navy panel. Never as the main logo.
- Circuit-trace texture: SVG line pattern at ~6–10% opacity on navy surfaces (sidebar, dark header bands, login).

## Layout structure (keep)
Fixed left navy sidebar (FourTech logo + "Escalas", company picker for master, nav: Escala da semana, Funcionários,
Configurações, Histórico, Empresas, Usuários; "Dados" group with Baixar/Restaurar backup; footer with team summary,
user box and Claro/Escuro/Sistema theme switch). White content area: page head (title + description + actions),
toolbar, cards, tables, the week grid.
