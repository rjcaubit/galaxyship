# Especificação — feat: MVP jogo 4X espacial GalaxyShip

**Issue:** #1
**Data:** 2026-06-15
**Status:** Aguardando implementação

## Objetivo

Construir do zero o jogo GalaxyShip — 4X espacial turn-based no browser com Pixi.js + React + Node.js/Express + PostgreSQL. MVP jogável solo com IA adversária, save/load, mapa de galáxia procedural, gestão de colônias, tech tree e diplomacia básica. Interface visual impactante e mobile-first.

---

## Pesquisa & Dependency Analysis

### O que já existe e pode ser reutilizado
| Item | Localização | Como uso |
|------|-------------|----------|
| — | — | Projeto do zero; toda a estrutura será criada |

### O que precisa ser criado
| Item | Tipo | Onde | Justificativa |
|------|------|------|--------------|
| Classes de entidade (Race, Planet, etc.) | Classes TypeScript abstratas | `shared/src/entities/` | Núcleo do jogo; reutilizadas por backend e frontend |
| Implementações concretas de raças e planetas | Classes TypeScript concretas | `shared/src/entities/impl/` | Parametrização de dados de jogo isolada da lógica |
| Biblioteca de componentes UI | Componentes React puros | `web/src/components/ui/` | Reutilizados em todos os painéis e telas |
| Componentes de jogo | Componentes React com props de entidade | `web/src/components/game/` | Reutilizados entre painéis sem acoplar ao store |
| Lógica de jogo | Funções puras TypeScript | `shared/src/logic/` | Compartilhada entre backend (turn) e frontend (preview) |
| Pixi.js canvas layers | Classes TS + Pixi | `web/src/canvas/layers/` | Renderização WebGL da galáxia |
| Painéis React | Componentes de painel | `web/src/panels/` | Colony, Tech, Diplomacy, Combat, HUD |
| Zustand store | Slices de estado | `web/src/store/` | Estado global do jogo e auth |
| Express API | Rotas + serviços | `backend/src/` | Auth, game CRUD, turn processing |
| Prisma schema | Schema + migrations | `backend/prisma/` | Tabelas User e Game |

### Padrões canônicos a seguir
- **Entidades como classes:** toda entidade herda de `Entity` abstrata; interface `*Actions` define assinatura pública antes da implementação concreta
- **Componentes UI puros:** `components/ui/` sem import de store, sem lógica de jogo, props tipadas; touch target ≥44px
- **Componentes de jogo via props:** `components/game/` recebem instâncias de entidade por props, não leem store
- **Canvas único:** Pixi.js criado via `useRef`, nunca recriado pelo React
- **API URL:** `import.meta.env.VITE_API_URL || 'http://localhost:3301/api'`
- **Auth:** `Authorization: Bearer {token}` em todos os endpoints protegidos
- **Save:** apenas ao fim do turno via `PUT /api/game/:id/save`

### Decisões técnicas
| Decisão | Alternativa descartada | Motivo |
|---------|------------------------|--------|
| Classes abstratas + interfaces para entidades | Interfaces puras / tipos | Classes permitem lógica compartilhada e construtor tipado; interfaces só definem contratos sem implementação padrão |
| Pixi.js v8 para mapa | Phaser, SVG, Canvas2D | WebGL com melhor DX TypeScript; suporte a touch nativo; sprite batching para performance mobile |
| Zustand para estado | Redux, Context API | API mínima, sem boilerplate; fácil serialização para save |
| `stateJson` JSONB no Postgres | Tabelas relacionais por entidade | Estado do jogo muda por turno; JSONB evita dezenas de joins; normalização futura em migração |
| Monorepo com `shared/` | Copiar tipos entre repos | Única fonte de verdade para entidades e lógica de jogo |

### Riscos técnicos
| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Pixi.js + React re-render destrói canvas | alta | `useRef` para container, `useEffect` com cleanup, nunca expor elemento ao React |
| Performance em mobile mid-range (galáxia 80+ estrelas) | média | Sprite batching, LOD para estrelas distantes, fps cap em 30 |
| Estado do jogo cresce além de 1MB JSONB | baixa no MVP | Limitar galáxia a 60 sistemas no MVP; comprimir com `JSON.stringify` otimizado |
| FSM de IA bloqueia event loop no turno | média | Rodar `aiController` em `setImmediate` chunks ou separar em worker |

---

## Requisitos Funcionais

### RF00 — Estrutura de Entidades (shared/)
- [ ] RF00.1: `Entity` abstrata com `id: string`, `name: string`, `serialize(): Record<string, unknown>`, `static deserialize(data): Entity`
- [ ] RF00.2: `Race extends Entity` com interface `RaceActions` (canDiplomatize, getDiplomacyModifier, canColonizePlanet, getProductionBonus, getResearchBonus, getGrowthBonus)
- [ ] RF00.3: `Planet extends Entity` com interface `PlanetActions` (canColonize, colonizationCost, getMaxPopulation, getBaseProduction, getBaseResearch, getBaseFood, canBuild)
- [ ] RF00.4: `StarSystem extends Entity` com interface `StarSystemActions` (isExplored, isColonized, getColonizerRaceId, distanceTo, canBeReachedBy)
- [ ] RF00.5: `Fleet extends Entity` com interface `FleetActions` (canMoveTo, movementRange, totalAttackPower, totalDefensePower, canColonize, executeOrder)
- [ ] RF00.6: `Technology extends Entity` com interface `TechnologyActions` (isAvailable, canResearch, applyEffect, getDescription)
- [ ] RF00.7: `Building extends Entity` com interface `BuildingActions` (canBuildOn, getEffectOn, getDescription)
- [ ] RF00.8: `Colony extends Entity` com interface `ColonyActions` (getStats, addBuilding, removeBuilding, growthPerTurn, productionPerTurn)
- [ ] RF00.9: Implementações concretas: `HumanRace`, `ZorgRace` (agressiva), `SylarRace` (expansionista), planetas por tipo
- [ ] RF00.10: Tipos/enums em `shared/src/types/`: `PlanetType`, `StarType`, `TechCategory`, `StatKey`, `OrderType`, `GameState`

### RF01 — Scaffold do Monorepo
- [ ] RF01.1: `docker-compose.yml` com containers `db` (PostgreSQL :55432), `backend` (:3301), `web` (:3300)
- [ ] RF01.2: `backend/` com Express + TypeScript + Prisma configurados
- [ ] RF01.3: `web/` com Vite + React + TypeScript + Tailwind + Pixi.js configurados
- [ ] RF01.4: `shared/` como package npm local referenciado por backend e web

### RF02 — Autenticação
- [ ] RF02.1: `POST /api/auth/register` — username + password → cria User, retorna JWT
- [ ] RF02.2: `POST /api/auth/login` — username + password → valida, retorna JWT
- [ ] RF02.3: Middleware JWT protege todas as rotas `/api/game/*`
- [ ] RF02.4: Tela de login/registro no frontend com form válido

### RF03 — Nova Partida e Seleção de Raça
- [ ] RF03.1: Tela `RaceSelectScreen` mostra 3 raças (Human, Zorg, Sylar) com `RaceCard` para cada
- [ ] RF03.2: `RaceCard` exibe nome, descrição, bônus e penalidades formatados
- [ ] RF03.3: `POST /api/game/new` — recebe raceId, gera galáxia com seed aleatório, persiste `Game` no banco
- [ ] RF03.4: Frontend redireciona para mapa após criar partida

### RF04 — Galáxia Procedural
- [ ] RF04.1: `galaxyGenerator(seed)` gera 50-60 sistemas estelares com posições (x,y) normalizadas
- [ ] RF04.2: Cada sistema tem: tipo de estrela, 1-5 planetas, nome gerado (ex: "Tau Ceti III")
- [ ] RF04.3: Jogador começa com sistema home já explorado e colonizado; outros sistemas são "névoa de guerra" (fog of war)
- [ ] RF04.4: Distâncias entre sistemas determinam alcance de frotas

### RF05 — Mapa da Galáxia (Pixi.js)
- [ ] RF05.1: `GalaxyMapCanvas` renderiza estrelas em WebGL com cores por tipo (amarela, azul, vermelha, branca)
- [ ] RF05.2: Estrelas pulsam com brilho animado (shader ou tween de alpha)
- [ ] RF05.3: `NebulaeLayer` exibe nebulosas coloridas como fundo (sprites pré-geradas, parallax leve)
- [ ] RF05.4: Sistemas fog-of-war aparecem como pontos cinza sem nome
- [ ] RF05.5: Sistemas explorados mostram nome e ícone de colonizado (se houver colônia)
- [ ] RF05.6: Frotas aparecem como ícones animados sobre o mapa
- [ ] RF05.7: Drag para mover viewport (touch + mouse); pinch-to-zoom no mobile
- [ ] RF05.8: Tap/click em estrela abre `StarSystemInfo` popup

### RF06 — Sistema de Turnos
- [ ] RF06.1: HUD sempre visível com botão "Fim de Turno" (mínimo 44px de touch target)
- [ ] RF06.2: `POST /api/game/:id/turn` processa: recursos, crescimento, construção, IA, combates
- [ ] RF06.3: Frontend exibe animação de "processando turno" durante fetch
- [ ] RF06.4: Após turno, eventos são exibidos em fila (combate, diplomacia, etc.)
- [ ] RF06.5: Número do turno exibido no HUD via `TurnCounter`

### RF07 — Gestão de Colônia
- [ ] RF07.1: Tap em planeta colonizado abre `ColonyPanel` (bottom-sheet mobile, sidebar desktop)
- [ ] RF07.2: `ColonyPanel` exibe `ColonyStats` (produção, pesquisa, comida, população)
- [ ] RF07.3: Lista de edifícios construídos com `BuildingCard` (nome, efeito)
- [ ] RF07.4: Fila de construção: escolher próximo edifício ou nave a construir
- [ ] RF07.5: `ProgressBar` mostra progresso de construção atual (turnos restantes)
- [ ] RF07.6: Crescimento populacional calculado por `Colony.growthPerTurn()`

### RF08 — Frotas e Movimento
- [ ] RF08.1: Tap em frota própria abre `FleetCard` com opções de mover/atacar
- [ ] RF08.2: Após selecionar "Mover", sistemas alcançáveis ficam destacados no mapa
- [ ] RF08.3: Tap em sistema destino cria ordem de movimento (`OrderType.MOVE`)
- [ ] RF08.4: Frotas se movem visualmente no mapa ao confirmar turno
- [ ] RF08.5: Colonizar: frota com colono em sistema vazio → funda colônia

### RF09 — Tecnologia
- [ ] RF09.1: Tech tree com 6 categorias: Armas, Defesa, Propulsão, Construção, Computadores, Biologia
- [ ] RF09.2: Cada categoria tem 5 tecnologias com custo crescente de pesquisa
- [ ] RF09.3: `TechTreePanel` exibe nós `TechNode` com status: pesquisado, disponível, bloqueado
- [ ] RF09.4: Jogador aloca pontos de pesquisa por turno em uma categoria ativa
- [ ] RF09.5: Tecnologias pesquisadas desbloqueiam construções e melhorias de naves

### RF10 — Combate
- [ ] RF10.1: `combatResolver(attacker, defender)` calcula resultado com aleatoriedade e stats
- [ ] RF10.2: `CombatModal` exibe log animado linha por linha (rounds de combate)
- [ ] RF10.3: Resultado: atacante vence (sistema capturado), defensor vence (frota atacante destruída)
- [ ] RF10.4: Colônia capturada muda de dono; raça derrotada mantém outras colônias

### RF11 — IA Adversária (FSM)
- [ ] RF11.1: Zorg (agressiva): FSM — expandir → atacar vizinhos → manter fronteira
- [ ] RF11.2: Sylar (expansionista): FSM — colonizar systems vazios → pesquisar → defender
- [ ] RF11.3: IA age no backend durante `POST /api/game/:id/turn`
- [ ] RF11.4: IA não tem fog of war (conhece mapa completo)

### RF12 — Diplomacia
- [ ] RF12.1: `DiplomacyPanel` lista raças com status de relação: Paz / Guerra / Neutro
- [ ] RF12.2: Ações disponíveis: Declarar Guerra, Propor Paz, Oferecer Tecnologia
- [ ] RF12.3: IA aceita/recusa propostas baseado em FSM e modificador diplomático da raça
- [ ] RF12.4: `DiplomacyRow` exibe raça, status, ações com `IconButton`

### RF13 — Save / Load
- [ ] RF13.1: `PUT /api/game/:id/save` persiste `stateJson` ao fim de cada turno
- [ ] RF13.2: `GET /api/game/:id` retorna game com estado JSON
- [ ] RF13.3: Frontend hidrata `GameState` do JSON e reinicializa entidades com `deserialize()`
- [ ] RF13.4: Tela de menu mostra partida salva com botão "Continuar"

### RF14 — Features Bloqueadas (🔒)
- [ ] RF14.1: Componente `LockedFeature` envolve qualquer UI futura com overlay 🔒
- [ ] RF14.2: Tooltip "Em breve" ao tap/hover
- [ ] RF14.3: Botões locked ficam cinza e não disparam ação ao clicar
- [ ] RF14.4: Items bloqueados no MVP: Designer de Naves, Multiplayer, Combate Tático, Sons

---

## Requisitos Não-Funcionais

- [ ] RNF01: **Mobile-first** — toda UI funcional em viewport 375px; painéis são bottom-sheet em telas < `md`
- [ ] RNF02: **Touch targets** ≥ 44×44px em todos os elementos interativos
- [ ] RNF03: **Performance canvas** — 60fps em desktop, 30fps em mobile mid-range (Moto G Power); max 60 estrelas com brilho ativo
- [ ] RNF04: **Visual dark-space** — background escuro (#0a0a1a), cores neon/vibrantes para raças, gradientes para nebulosas
- [ ] RNF05: **Sem hover-only** — toda interação hover tem equivalente tap/focus
- [ ] RNF06: **Auth obrigatória** para acessar jogo; JWT em memória (não localStorage no MVP)
- [ ] RNF07: **Portabilidade** — lógica de jogo em `shared/` sem dependências de browser ou Node

---

## Modelo de Dados

### Schema Prisma

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  games        Game[]
}

model Game {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  seed       Int
  turnNumber Int      @default(1)
  raceId     String
  stateJson  Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Estrutura de `stateJson` (GameState)

```typescript
interface GameState {
  turn: number
  playerRaceId: string
  systems: Record<string, StarSystemData>    // systemId → dados serializados
  colonies: Record<string, ColonyData>       // systemId → dados de colônia
  fleets: Record<string, FleetData>          // fleetId → dados de frota
  relations: Record<string, DiplomacyRelation> // raceId → relação com jogador
  researchedTechs: string[]
  activeResearch: { category: TechCategory; pointsAccumulated: number } | null
  resources: { production: number; research: number; food: number; credits: number }
  exploredSystems: string[]                  // systemIds revelados
}
```

---

## API

### Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/register` | Registrar usuário | Não |
| POST | `/api/auth/login` | Login → JWT | Não |
| POST | `/api/game/new` | Nova partida (raceId no body) | Sim |
| GET | `/api/game/:id` | Carregar partida | Sim |
| POST | `/api/game/:id/turn` | Processar turno (orders no body) | Sim |
| PUT | `/api/game/:id/save` | Salvar estado atual | Sim |
| GET | `/api/game/list` | Listar partidas do usuário | Sim |

### Payloads principais

**POST /api/game/new**
```json
{ "raceId": "humans" }
```
Resposta `201`:
```json
{ "gameId": "clxxx", "state": { /* GameState */ } }
```

**POST /api/game/:id/turn**
```json
{
  "orders": [
    { "type": "MOVE_FLEET", "fleetId": "f1", "targetSystemId": "s12" },
    { "type": "SET_RESEARCH", "category": "weapons" },
    { "type": "START_BUILD", "colonySystemId": "s1", "buildingId": "factory" }
  ],
  "diplomacyActions": [
    { "targetRaceId": "zorg", "action": "DECLARE_WAR" }
  ]
}
```
Resposta `200`:
```json
{
  "state": { /* GameState atualizado */ },
  "events": [
    { "type": "COMBAT", "systemId": "s12", "result": { /* CombatResult */ } },
    { "type": "TECH_UNLOCKED", "techId": "laser_cannon_2" }
  ]
}
```

### Códigos de erro
| Código | Quando |
|--------|--------|
| 400 | Payload inválido / ordem ilegal |
| 401 | Sem JWT ou JWT expirado |
| 403 | Game pertence a outro usuário |
| 404 | Game não encontrado |

---

## Frontend — Páginas e Componentes

### Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `HomePage` | Login / nova partida / continuar |
| `/login` | `LoginPage` | Form de auth |
| `/game/new` | `RaceSelectScreen` | Escolha de raça |
| `/game/:id` | `GameScreen` | Canvas + HUD + painéis |

### Componentes UI (reutilizáveis — `components/ui/`)

Todos sem estado de jogo. Ver CODEMAP seção "Frontend — UI" para props completas.

`Button`, `Card`, `Modal`, `Panel`, `Badge`, `ProgressBar`, `ResourceDisplay`, `Tooltip`, `Spinner`, `IconButton`, `Divider`, `EmptyState`

### Componentes de Jogo (via props — `components/game/`)

Recebem entidades por props, não acessam store. Ver CODEMAP seção "Frontend — Game".

`RaceCard`, `PlanetCard`, `StarSystemInfo`, `FleetCard`, `TechNode`, `ColonyStats`, `DiplomacyRow`, `CombatLogEntry`, `TurnCounter`, `ResourceHUD`, `LockedFeature`

### Painéis (`panels/`)

`HUDOverlay`, `ColonyPanel`, `TechTreePanel`, `DiplomacyPanel`, `CombatModal`, `RaceSelectScreen`

---

## Arquitetura das Classes de Entidade

```typescript
// shared/src/entities/Entity.ts
export interface EntityParams {
  id: string
  name: string
}
export abstract class Entity {
  readonly id: string
  readonly name: string
  constructor(params: EntityParams) {
    this.id = params.id
    this.name = params.name
  }
  abstract serialize(): Record<string, unknown>
  static deserialize(_data: Record<string, unknown>): Entity {
    throw new Error('Subclass must implement deserialize')
  }
}

// shared/src/entities/Race.ts
export interface RaceParams extends EntityParams {
  description: string
  bonuses: Partial<Record<StatKey, number>>
  penalties: Partial<Record<StatKey, number>>
  traits: TraitKey[]
  color: string          // hex — cor no mapa e UI
}
export interface RaceActions {
  canDiplomatize(other: Race): boolean
  getDiplomacyModifier(other: Race): number
  canColonizePlanet(planet: Planet): boolean
  getProductionBonus(): number
  getResearchBonus(): number
  getGrowthBonus(): number
}
export abstract class Race extends Entity implements RaceActions {
  readonly description: string
  readonly bonuses: Partial<Record<StatKey, number>>
  readonly penalties: Partial<Record<StatKey, number>>
  readonly traits: TraitKey[]
  readonly color: string
  constructor(params: RaceParams) { super(params); /* ... */ }
  getProductionBonus(): number { return this.bonuses.production ?? 0 }
  getResearchBonus(): number  { return this.bonuses.research ?? 0 }
  getGrowthBonus(): number    { return this.bonuses.growth ?? 0 }
  abstract canDiplomatize(other: Race): boolean
  abstract getDiplomacyModifier(other: Race): number
  abstract canColonizePlanet(planet: Planet): boolean
  serialize(): Record<string, unknown> { return { id: this.id, name: this.name, /* ... */ } }
}

// Padrão idêntico para Planet, StarSystem, Fleet, Technology, Building, Colony
// Ver 03-tasks.md para implementação completa de cada classe
```

---

## Cenários de Teste

### CT01: Fluxo completo de nova partida
```
DADO usuário registrado
QUANDO POST /api/game/new com { "raceId": "humans" }
ENTÃO 201 + state.systems contém 50-60 sistemas
     + state.exploredSystems contém apenas sistema home
     + GET /api/game/:id retorna mesmo estado
```

### CT02: Turno com movimento de frota
```
DADO partida criada, frota em sistema home
QUANDO POST /api/game/:id/turn com order MOVE_FLEET para sistema adjacente
ENTÃO 200 + state.fleets[fleetId].systemId === targetSystemId
     + turn incrementou em 1
```

### CT03: Combate automático
```
DADO frota do jogador no mesmo sistema que frota NPC Zorg
QUANDO POST /api/game/:id/turn sem ordens
ENTÃO events contém { type: "COMBAT", result: { winner: "humans"|"zorg" } }
     + estado reflete resultado (frota destruída ou sistema capturado)
```

### CT04: Save/Load
```
DADO partida no turno 5 com colônia fundada
QUANDO GET /api/game/:id
ENTÃO stateJson contém colonies com dados da colônia
     + frontend hidrata GameState corretamente (sem erro de deserialização)
```

### CT05: Auth — rota protegida sem token
```
DADO requisição sem Authorization header
QUANDO GET /api/game/:id
ENTÃO 401 { "error": "unauthorized" }
```

### CT06: Auth — game de outro usuário
```
DADO usuário A logado, gameId pertence ao usuário B
QUANDO GET /api/game/:id
ENTÃO 403 { "error": "forbidden" }
```

### CT07: E2E click-by-click [E2E click-by-click]

**Pré-condições:** `docker compose up -d`, backend :3301 e web :3300 rodando.

**Sequência:**
1. Navegar para `http://localhost:3300/` → screenshot
2. Clicar "Registrar" → preencher username + password → submit → screenshot (redireciona para `/game/new`)
3. `RaceSelectScreen`: snapshot → clicar em card da raça "Humanos" → screenshot (card selecionado highlighted)
4. Clicar "Iniciar Partida" → screenshot (loading) → screenshot (mapa carregado com estrelas)
5. Mapa: snapshot → clicar em estrela do sistema home → screenshot (StarSystemInfo popup aberto)
6. Fechar popup → snapshot → clicar botão "Tecnologia" no HUD → screenshot (TechTreePanel aberto)
7. Snapshot do painel → clicar em tech disponível → screenshot (tech selecionada para pesquisa)
8. Fechar painel → clicar "Fim de Turno" → screenshot (processando) → screenshot (turno 2, HUD atualizado)
9. Abrir `ColonyPanel` via tap no planeta home → screenshot (stats + fila de construção visível)
10. Verificar em mobile 375px: snapshots dos steps 4, 5, 9 em viewport reduzido (bottom-sheet)
11. Logout → screenshot (volta para home)

**Saída:** screenshots em `docs/test-results/issue-1-e2e/`
**Critério:** zero crash, zero botão silencioso, bottom-sheet funciona no mobile viewport.

---

## Decisões Arquiteturais

| Decisão | Justificativa |
|---------|---------------|
| `shared/` como npm local (workspace) | Entidades e lógica usadas em backend e frontend sem duplicação |
| Classes abstratas com interface `*Actions` | Força implementação de contratos; facilita mocks em testes; nova raça = nova subclasse, não mudança de lógica |
| Componentes UI sem import de store | Máxima reutilização; testáveis sem context; compatível com React Native futuro |
| `stateJson` JSONB em vez de tabelas por entidade | Galáxia tem estrutura variável por seed; JSONB é flexível e suficiente para MVP solo |
| IA no backend (não no frontend) | Garante consistência do estado; prepara para multiplayer onde servidor é fonte de verdade |

---

## Fora do Escopo
- Multiplayer via WebSockets
- Sons e trilha sonora
- Designer de naves customizadas
- Combate tático em grid
- Múltiplos saves por usuário
- Modo campanha/narrativa
- Testes automatizados (unitários/integração) — planejados para issue futura

---

## Docs canônicas a atualizar
- [x] `/docs/CODEMAP.md` (criado nesta issue)
- [x] `/docs/sdd/ISSUE_1/00-design.md` (existente)
- [ ] `/docs/ARCHITECTURE.md` (criar — containers e comunicação)
- [ ] `/docs/CHANGELOG.md` (criar — após implementação)
