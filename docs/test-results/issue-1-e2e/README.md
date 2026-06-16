# E2E — Issue #1 — Jornada completa GalaxyShip

**Data:** 2026-06-15
**Stack testada:** backend :3301 + web :3300 (dev) + Postgres :55432

## Jornada testada (click-by-click)

| # | Screenshot | Passo | Resultado |
|---|-----------|-------|-----------|
| 01 | `01-login.png` | Tela de login/registro | ✅ Renderiza dark-space, tabs Entrar/Registrar |
| 02 | `02-race-select.png` | Registro → seleção de raça | ✅ 3 raças (Humanos/Zorg/Sylar) com bônus/penalidades coloridos |
| 03a | `03-galaxy-map.png` | Mapa (ANTES do fix) | ❌ Canvas em branco — bug Pixi+StrictMode |
| 03b | `03-galaxy-map-fixed.png` | Mapa (DEPOIS do fix) | ✅ Estrelas pulsantes, nebulosas, fog-of-war, home colonizado |
| 04 | `04-colony-panel.png` | Tap na estrela home → ColonyPanel | ✅ Bottom-sheet "Alpha Prime", pop 4, barras produção/construção |
| 05 | `05-tech-tree.png` | HUD → Árvore de Tecnologias | ✅ Sidebar com 6 categorias × 5 níveis bloqueados (🔒) |
| 06 | `06-mobile-map.png` | Viewport 375px | ✅ HUD com flex-wrap, mapa, botão centralizado |
| 07 | `07-mobile-tech.png` | TechTree em mobile | ✅ Drawer vira full-width abaixo de `md` |
| 08 | `08-mobile-fresh-map.png` | Login limpo a 375px (mobile-first) | ✅ Galáxia renderiza nativa em mobile |

**Fim de Turno:** turno avançou de 1 → 2 (verificado via DOM, recursos recalculados).

## Bug encontrado e corrigido durante o E2E

**Pixi.js + React StrictMode — canvas em branco.**
- **Sintoma:** mapa não renderizava (canvas dimensionado mas stage vazio); HUD OK.
- **Root cause:** StrictMode faz `useEffect` rodar mount→unmount→mount em dev. O `destroyPixiApp()` no cleanup destruía o contexto WebGL; o re-init criava uma segunda `Application` competindo pela mesma canvas → render em branco.
- **Fix:**
  1. `web/src/main.tsx` — remoção do `<React.StrictMode>` (correto p/ produção; padrão em libs de canvas).
  2. `web/src/canvas/PixiApp.ts` — singleton agora cacheia a *promise* de init, garantindo instância única mesmo sob chamadas concorrentes.
- **Verificação:** após o fix, mapa renderiza com estrelas, nebulosas e sistema home colonizado (03b). Este era exatamente o risco "Pixi.js + React conflito de ciclo de vida" mapeado na spec.

## Cobertura de cenários (02-spec.md)

| CT | Onde validado |
|----|---------------|
| CT01 nova partida | smoke.mjs (55 sistemas, 1 explorado) + 02/03b |
| CT02 turno/movimento | smoke.mjs + "Fim de Turno" → turno 2 |
| CT03 combate | smoke.mjs (frota NPC semeada) |
| CT04 save/load | smoke.mjs (load mantém estado) |
| CT05 auth sem token → 401 | smoke.mjs |
| CT06 game de outro user → 403 | smoke.mjs |
| CT07 E2E click-by-click | esta jornada (01–08) |

## Observações / limitações conhecidas (MVP)
- O mapa não re-renderiza posições das estrelas ao **redimensionar** a janela após criar a partida (artefato visto ao passar de desktop→mobile com partida já aberta). Em load mobile-first nativo funciona (08). Re-render on resize fica para issue de polish.
- Console: apenas 404 de favicon e warnings de React Router future flags — nada bloqueante.
