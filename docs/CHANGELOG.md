# Changelog — GalaxyShip

## 2026-06-15 — #1 — feat: MVP jogo 4X espacial GalaxyShip

### Adicionado
- Scaffold monorepo (shared + backend + web + docker-compose)
- Sistema de classes de entidade: Entity, Race, Planet, StarSystem, Fleet, Colony, Technology, Building
- Implementações concretas de raças: HumanRace, ZorgRace, SylarRace
- API backend: auth (register/login JWT), game (new/load/turn/save/list)
- Gerador de galáxia procedural baseado em seed (55 sistemas)
- Biblioteca de componentes UI reutilizáveis (Button, Card, Modal, Panel, Badge, ProgressBar, etc.)
- Componentes de jogo (RaceCard, ColonyStats, ResourceHUD, CombatLogEntry, TurnCounter, LockedFeature)
- Canvas Pixi.js com mapa da galáxia (estrelas pulsantes coloridas, nebulosas, fog of war)
- Painéis: HUD, Colony (bottom-sheet), TechTree, Diplomacy, CombatModal
- Telas: Login/Register, RaceSelect, GameScreen
- Save/Load via PostgreSQL (stateJson JSONB)
- Mobile: bottom-sheet panels, drag + pinch-zoom no mapa, touch targets ≥44px
- Features futuras bloqueadas na UI (🔒 "Em breve") via componente LockedFeature
- Economia de turno: recursos recalculados das colônias, crescimento populacional, progresso/conclusão de construção, desbloqueio de pesquisa
- Endpoint dedicado `POST /game/:id/diplomacy` (ação diplomática sem avançar turno)
- Smoke test de API (`backend/scripts/smoke.mjs`) — 21 checks cobrindo CT01–CT06 + economia (B2) + diplomacia (B1)

### Conhecido / próximo (stubs do MVP — ver CODEMAP "Status de implementação")
- IA NPC é movimento aleatório (não FSM); combate não captura sistemas; tech tree é visual; sem UI de movimento de frota; sem HomePage "Continuar"

- Spec: docs/sdd/ISSUE_1/02-spec.md
