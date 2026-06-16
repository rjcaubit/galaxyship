# Changelog — GalaxyShip

## 2026-06-16 — gameplay solo completo (#1)

### Motor de jogo (shared, modular + verificado)
- Módulos: `constants`, `techCatalog`, `gameMath`, `ai`, `combat`, `gameSetup`, `turnProcessor` (movido do backend)
- Movimento de frota com **ETA** (distância ÷ velocidade, afetada por tech de propulsão)
- Colonização (nave colônia → sistema vazio → colônia)
- Economia por **ratios estilo Master of Orion**: Indústria/Ecologia/Pesquisa/Naves/Defesa
- Tecnologia com **efeitos reais** (6 categorias × 5 níveis): ataque, defesa, velocidade, fábricas/desconto, pesquisa, pop máx
- **IA com FSM** e personalidades (Zorg agressivo, Sylar expansionista) — NPCs com colônias e economia próprias
- Combate com **atrito** (conquistar custa naves) e captura de sistema; **fusão de frotas** concentra a força
- Condição de **vitória/derrota**; defesa planetária inerente (pop+fábricas+bases)
- Verificado por **simulador headless** (`shared/scripts/sim.cjs`): 13 checks; bateria 3 raças × 4 seeds sem falhas, desfechos variados

### Interface de jogabilidade (web)
- **Naves Kenney (CC0)** no mapa, tingidas por raça; frotas em trânsito ao longo das rotas com ETA
- **Painel do sistema**: planetas, frotas presentes, ações (mover, colonizar, gerenciar)
- **Movimento**: selecionar frota → modo mover → tocar destino (painéis não bloqueiam o mapa)
- **Painel de colônia** estilo MoO: 5 sliders de produção + fila de construção de naves (Destróier bloqueado por tech)
- **Árvore de tecnologia funcional**: escolher pesquisa, ver tiers e progresso
- **Relatório de turno** (chegada/colônia/combate/tech) + **modal de vitória/derrota**
- **Modo solo sem login** roda 100% no browser (localStorage), sem backend nem Docker

### Robustez
- Backend resiliente a falha de DB (asyncHandler + guards de processo)


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
