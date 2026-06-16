# CODEMAP — GalaxyShip

> Fonte da verdade arquitetural. Atualizar a cada issue implementada.
> Última atualização: 2026-06-15 (ISSUE_1 — spec criada, pré-implementação)

---

## Índice rápido

| Seção | Conteúdo |
|-------|----------|
| [Monorepo](#monorepo) | Estrutura de pastas e responsabilidades |
| [Shared](#shared) | Classes de entidade, tipos, constantes do jogo |
| [Backend](#backend) | Express, Prisma, rotas, serviços |
| [Frontend — UI](#frontend-ui) | Biblioteca de componentes reutilizáveis |
| [Frontend — Game](#frontend-game) | Componentes específicos do jogo |
| [Frontend — Canvas](#frontend-canvas) | Pixi.js — mapa da galáxia |
| [Frontend — Panels](#frontend-panels) | Painéis React (colônia, tech, diplomacia) |
| [Frontend — Store](#frontend-store) | Zustand — estado global do jogo |
| [Padrões canônicos](#padrões-canônicos) | Regras que toda nova feature deve seguir |

---

## Monorepo

```
galaxyship/
├── shared/               # Entidades, tipos, lógica de jogo (agnóstico de plataforma)
│   ├── src/
│   │   ├── entities/     # Classes abstratas + concretas do jogo
│   │   ├── logic/        # Gerador de galáxia, combate, IA, turno
│   │   └── types/        # Interfaces, enums, constantes
│   └── package.json
├── backend/              # Node.js/Express/Prisma
│   ├── src/
│   │   ├── routes/       # auth.ts, game.ts
│   │   ├── services/     # gameService.ts, turnService.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── web/                  # React + Pixi.js + Zustand + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/       # Biblioteca de componentes estáticos reutilizáveis
│   │   │   └── game/     # Componentes específicos do jogo
│   │   ├── canvas/       # Pixi.js — GalaxyMapCanvas + camadas
│   │   ├── panels/       # Painéis de jogo (Colony, Tech, Diplomacy, Combat)
│   │   ├── store/        # Zustand slices
│   │   ├── hooks/        # useGame, useAuth, usePixi
│   │   ├── api/          # Funções de fetch para backend
│   │   └── styles/       # tokens.ts, tailwind.config.ts
│   └── package.json
└── docker-compose.yml
```

---

## Shared

### Entidades (classes abstratas + concretas)

> **Padrão:** toda entidade estende `Entity` e implementa sua interface de ações.
> Parâmetros definidos em `*Params`. Ações em `*Actions`. Classe abstrata em `entities/`.
> Implementações concretas em `entities/impl/`.

| Arquivo | Classe | Params | Actions |
|---------|--------|--------|---------|
| `shared/src/entities/Entity.ts` | `Entity` (base) | `EntityParams` | `serialize()`, `static deserialize()` |
| `shared/src/entities/Race.ts` | `Race extends Entity` | `RaceParams` | `RaceActions` |
| `shared/src/entities/Planet.ts` | `Planet extends Entity` | `PlanetParams` | `PlanetActions` |
| `shared/src/entities/StarSystem.ts` | `StarSystem extends Entity` | `StarSystemParams` | `StarSystemActions` |
| `shared/src/entities/Fleet.ts` | `Fleet extends Entity` | `FleetParams` | `FleetActions` |
| `shared/src/entities/Technology.ts` | `Technology extends Entity` | `TechnologyParams` | `TechnologyActions` |
| `shared/src/entities/Building.ts` | `Building extends Entity` | `BuildingParams` | `BuildingActions` |
| `shared/src/entities/Colony.ts` | `Colony extends Entity` | `ColonyParams` | `ColonyActions` |
| `shared/src/entities/impl/HumanRace.ts` | `HumanRace extends Race` | — | implementação concreta |
| `shared/src/entities/impl/ZorgRace.ts` | `ZorgRace extends Race` | — | raça NPC agressiva |
| `shared/src/entities/impl/SylarRace.ts` | `SylarRace extends Race` | — | raça NPC expansionista |
| `shared/src/entities/impl/TerranPlanet.ts` | `TerranPlanet extends Planet` | — | planeta padrão |

### Lógica de jogo

| Arquivo | Responsabilidade |
|---------|-----------------|
| `shared/src/logic/galaxyGenerator.ts` | Gera galáxia proceduralmente a partir de seed |
| `shared/src/logic/combatResolver.ts` | Resolve combate frota vs frota → `CombatResult` |
| `shared/src/logic/turnProcessor.ts` | Aplica turno: recursos, construção, crescimento |
| `shared/src/logic/aiController.ts` | FSM de IA para raças NPC |
| `shared/src/logic/techTree.ts` | Registra e valida dependências de tecnologias |
| `shared/src/logic/colonyCalculator.ts` | Calcula stats derivados de colônia |

### Tipos

| Arquivo | O que define |
|---------|-------------|
| `shared/src/types/game.ts` | `GameState`, `PlayerState`, `DiplomacyRelation` |
| `shared/src/types/enums.ts` | `PlanetType`, `StarType`, `PlanetSize`, `TechCategory`, etc. |
| `shared/src/types/stats.ts` | `StatKey`, `ColonyStats`, `FleetStats`, `CombatResult` |

---

## Backend

| Arquivo | Responsabilidade |
|---------|-----------------|
| `backend/src/index.ts` | Bootstrap Express, middlewares, rotas |
| `backend/src/routes/auth.ts` | `POST /api/auth/register`, `POST /api/auth/login` |
| `backend/src/routes/game.ts` | `POST /api/game/new`, `GET /api/game/:id`, `POST /api/game/:id/turn`, `PUT /api/game/:id/save` |
| `backend/src/services/gameService.ts` | Criar partida, serializar/deserializar GameState |
| `backend/src/services/turnService.ts` | Orquestra `turnProcessor` + `aiController` + `combatResolver` |
| `backend/prisma/schema.prisma` | Tabelas: `User`, `Game` |

### Schema Prisma

```
User    — id, username, passwordHash, createdAt
Game    — id, userId, seed, turnNumber, stateJson, createdAt, updatedAt
```

---

## Frontend — UI

> **Padrão:** componentes em `/web/src/components/ui/` são **puros e reutilizáveis** — sem estado de jogo,
> sem import de store, sem lógica de negócio. Props tipadas. Touch target mínimo 44px.
> Variantes via prop `variant`. Dark mode via classe Tailwind `dark:`.

| Componente | Props principais | Uso |
|-----------|-----------------|-----|
| `Button.tsx` | `variant`, `size`, `disabled`, `loading`, `onClick` | Todo botão do jogo |
| `Card.tsx` | `title?`, `footer?`, `className?` | Container de conteúdo |
| `Modal.tsx` | `open`, `onClose`, `title`, `children` | Diálogos e confirmações |
| `Panel.tsx` | `open`, `onClose`, `position` (bottom/right) | Bottom-sheet (mobile) / sidebar (desktop) |
| `Badge.tsx` | `variant` (success/warn/danger/info), `label` | Status indicators |
| `ProgressBar.tsx` | `value` (0-100), `color`, `label?` | Barras de recursos |
| `ResourceDisplay.tsx` | `icon`, `value`, `label`, `delta?` | Produção/pesquisa/comida/dinheiro |
| `Tooltip.tsx` | `content`, `locked?` | Hover/tap; `locked` mostra 🔒 + "Em breve" |
| `Spinner.tsx` | `size?` | Estados de carregamento |
| `IconButton.tsx` | `icon`, `label`, `onClick`, `size?` | Botões de ação touch-friendly |
| `Divider.tsx` | `label?` | Separadores de seção |
| `EmptyState.tsx` | `title`, `description`, `icon?` | Tela vazia |

---

## Frontend — Game

> Componentes específicos do jogo. Podem importar tipos do `shared/`. **Não** importam store diretamente —
> recebem dados via props para maximizar reutilização e testabilidade.

| Componente | Props | Uso |
|-----------|-------|-----|
| `RaceCard.tsx` | `race: Race`, `selected?`, `onSelect?` | Seleção de raça |
| `PlanetCard.tsx` | `planet: Planet`, `colony?: Colony` | Info do planeta |
| `StarSystemInfo.tsx` | `system: StarSystem`, `fleets`, `onClose` | Popup do sistema no mapa |
| `FleetCard.tsx` | `fleet: Fleet`, `onMove?`, `onAttack?` | Status e ações de frota |
| `TechNode.tsx` | `tech: Technology`, `status`, `onResearch?` | Nó da árvore de tecnologia |
| `ColonyStats.tsx` | `colony: Colony`, `planet: Planet` | Barras prod/pesquisa/comida |
| `DiplomacyRow.tsx` | `race: Race`, `relation`, `onAction?` | Linha da raça no painel de diplomacia |
| `CombatLogEntry.tsx` | `entry: CombatLogLine` | Linha do log de combate |
| `TurnCounter.tsx` | `turn: number`, `maxTurns?` | Display do turno atual |
| `ResourceHUD.tsx` | `resources: PlayerResources` | HUD superior de recursos |
| `LockedFeature.tsx` | `label`, `reason?` | Wrapper 🔒 para features futuras |

---

## Frontend — Canvas

| Arquivo | Responsabilidade |
|---------|-----------------|
| `web/src/canvas/GalaxyMapCanvas.tsx` | Container React com canvas Pixi.js (useRef, nunca re-monta) |
| `web/src/canvas/layers/StarsLayer.ts` | Pixi — renderiza estrelas com brilho e tipo de cor |
| `web/src/canvas/layers/NebulaeLayer.ts` | Pixi — renderiza nebulosas procedurais como fundo |
| `web/src/canvas/layers/FleetsLayer.ts` | Pixi — ícones e rotas de frotas animadas |
| `web/src/canvas/layers/SelectionLayer.ts` | Pixi — anel de seleção e highlight de sistema |
| `web/src/canvas/PixiApp.ts` | Singleton Pixi.Application, gerencia viewport e touch |
| `web/src/hooks/usePixi.ts` | Hook: inicializa Pixi, expõe métodos de controle |
| `web/src/hooks/useMapInteraction.ts` | Touch/mouse: drag, pinch-zoom, tap em estrela |

---

## Frontend — Panels

| Arquivo | Componente | Abre via |
|---------|-----------|---------|
| `web/src/panels/ColonyPanel.tsx` | `ColonyPanel` | tap em planeta colonizado |
| `web/src/panels/TechTreePanel.tsx` | `TechTreePanel` | botão HUD "Tecnologia" |
| `web/src/panels/DiplomacyPanel.tsx` | `DiplomacyPanel` | botão HUD "Diplomacia" |
| `web/src/panels/CombatModal.tsx` | `CombatModal` | evento de combate no turno |
| `web/src/panels/RaceSelectScreen.tsx` | `RaceSelectScreen` | tela inicial nova partida |
| `web/src/panels/HUDOverlay.tsx` | `HUDOverlay` | sempre visível sobre o mapa |

---

## Frontend — Store

| Arquivo | Slice | Estado |
|---------|-------|--------|
| `web/src/store/gameStore.ts` | `useGameStore` | `gameState`, `selectedSystem`, `activePanels`, `turn` |
| `web/src/store/authStore.ts` | `useAuthStore` | `user`, `token`, `login()`, `logout()` |
| `web/src/api/gameApi.ts` | — | Funções fetch: `createGame()`, `loadGame()`, `endTurn()` |
| `web/src/api/authApi.ts` | — | `register()`, `login()` |

---

## Padrões canônicos

| Regra | Onde se aplica |
|-------|---------------|
| Toda entidade de jogo herda de `Entity` (shared) | `shared/src/entities/` |
| Interface `*Actions` define assinatura antes da implementação | `shared/src/entities/*.ts` |
| Componentes UI (`/ui/`) não importam store nem tipos de jogo | `web/src/components/ui/` |
| Componentes Game (`/game/`) recebem entidades via props, não leem store | `web/src/components/game/` |
| Canvas Pixi.js criado uma vez via `useRef`, nunca destruído pelo React | `GalaxyMapCanvas.tsx` |
| Touch target mínimo 44×44px em todos os elementos clicáveis | Todo componente UI |
| `Panel` usa bottom-sheet abaixo de `md:` e sidebar acima | `Panel.tsx` |
| Save via `PUT /api/game/:id/save` só ao fim de cada turno | `gameStore.ts` |
| Estado do jogo serializado como `GameState` JSON no PostgreSQL | `games.stateJson` |
| Multiplayer: socket.io pronto em `backend/src/index.ts` (comentado) | `backend/src/index.ts` |
