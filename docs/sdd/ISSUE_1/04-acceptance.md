# Aceitação — Issue #1 — MVP GalaxyShip

**Data:** 2026-06-15
**Branch:** `feature/sdd-issue-1`
**Status:** Implementado, testado, revisado

## Verificações executadas

| Verificação | Resultado |
|-------------|-----------|
| `shared` build (tsc) | ✅ 0 erros |
| `backend` typecheck (tsc --noEmit) | ✅ exit 0 |
| Migration Prisma (User, Game) | ✅ aplicada |
| `web` build (tsc + vite) | ✅ OK |
| Smoke test API (`backend/scripts/smoke.mjs`) | ✅ 21/21 |
| E2E click-by-click (Playwright) | ✅ jornada completa (8 screenshots) |

## Cenários de teste (02-spec.md)

| CT | Status | Onde |
|----|--------|------|
| CT01 nova partida (55 sistemas, fog of war) | ✅ | smoke + E2E |
| CT02 turno + movimento de frota | ✅ | smoke + E2E (turno 1→2) |
| CT03 combate | ✅ | smoke (frota NPC semeada) |
| CT04 save/load | ✅ | smoke (load mantém estado) |
| CT05 auth sem token → 401 | ✅ | smoke |
| CT06 game de outro user → 403 | ✅ | smoke |
| CT07 E2E click-by-click | ✅ | `docs/test-results/issue-1-e2e/` |

## Bugs encontrados e corrigidos

1. **Canvas Pixi em branco sob StrictMode** (E2E) — singleton recriava contexto WebGL. Fix: cache de promise + remoção de StrictMode. `03-galaxy-map.png` (antes) vs `03-galaxy-map-fixed.png` (depois).
2. **B1 — Diplomacia avançava o turno** (review) — `act()` chamava `/turn`. Fix: endpoint dedicado `POST /game/:id/diplomacy`.
3. **B2 — Turno não processava economia** (review) — recursos/pop/construção estáticos. Fix: `turnService` agora recalcula recursos das colônias, faz crescimento populacional, avança construção e desbloqueia pesquisa.

## Escopo entregue vs adiado (honesto)

### Funcional ✅
- Auth JWT, galáxia procedural, mapa Pixi (drag/pinch/fog of war), seleção de raça (3 raças como classes), colônia (crescimento + produção + construção), pesquisa (acúmulo + desbloqueio), diplomacia (paz/guerra), save/load, mobile-first (bottom-sheet, drawers full-width, touch ≥44px), features bloqueadas (🔒).

### Parcial / stub ⚠️ (documentado no CODEMAP "Status de implementação")
- **IA NPC:** movimento aleatório, não FSM por raça (RF11 parcial).
- **Combate:** resolve com ruído mas não captura sistema/colônia (RF10 parcial).
- **Tech tree:** UI é visual (nós 🔒); pesquisa funciona via acúmulo, não pela árvore (RF09 parcial).

### Adiado ❌ (issues futuras)
- UI de movimento de frota e colonização (FleetCard, StarSystemInfo) — RF08.
- Classes concretas não-Race (Planet/Fleet/Colony/Technology/Building são abstratas, estado trafega como `*Data`).
- HomePage com "Continuar" partida salva — RF13.4.
- Efeitos de tecnologia desbloqueada nos stats.

## Recomendação de follow-up
Abrir issues separadas para: (a) FSM de IA + combate com captura, (b) UI de frota/colonização, (c) tech tree funcional com efeitos, (d) HomePage/multi-save.
