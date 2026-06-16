# Tasks — feat: MVP jogo 4X espacial GalaxyShip

**Issue:** #1
**Baseado em:** `02-spec.md`
**Total:** ~85 tasks × 2-5min ≈ 7-9 horas de execução

---

## FASE 0 — Scaffold do Monorepo

### 0.1. Criar `docker-compose.yml`
**Criar:** `docker-compose.yml` na raiz
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: galaxyship
      POSTGRES_PASSWORD: galaxyship_dev
      POSTGRES_DB: galaxyship
    ports:
      - "55432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3301:3301"
    environment:
      DATABASE_URL: postgresql://galaxyship:galaxyship_dev@db:5432/galaxyship
      JWT_SECRET: dev_secret_change_in_prod
      PORT: 3301
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - ./shared:/shared
      - /app/node_modules

  web:
    build: ./web
    ports:
      - "3300:3300"
    environment:
      VITE_API_URL: http://localhost:3301/api
    volumes:
      - ./web:/app
      - ./shared:/shared
      - /app/node_modules

volumes:
  pgdata:
```
**Verificar:** `docker compose config` não exibe erro

### 0.2. Criar `shared/` — package.json e tsconfig
**Criar:** `shared/package.json`
```json
{
  "name": "@galaxyship/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```
**Criar:** `shared/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```
**Criar:** `shared/src/index.ts` (vazio por ora — só exportações futuras)
**Verificar:** `cd shared && npm install && npm run build` sem erros

### 0.3. Criar `backend/` — scaffold Express + Prisma
**Criar:** `backend/package.json`
```json
{
  "name": "galaxyship-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "@galaxyship/shared": "file:../shared"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "prisma": "^5.14.0",
    "tsx": "^4.15.0",
    "typescript": "^5.4.0"
  }
}
```
**Criar:** `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@galaxyship/shared": ["../shared/src/index"]
    }
  },
  "include": ["src/**/*"]
}
```
**Verificar:** `cd backend && npm install` conclui

### 0.4. Criar `backend/prisma/schema.prisma`
**Criar:** `backend/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

  @@index([userId])
}
```
**Verificar:** `cd backend && npx prisma validate` — válido

### 0.5. Criar `backend/src/index.ts` — bootstrap Express
**Criar:** `backend/src/index.ts`
```typescript
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3301

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3300' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Rotas serão registradas aqui (auth, game)

// Placeholder multiplayer (socket.io) — habilitado em issue futura
// import { Server } from 'socket.io'
// const io = new Server(server, { cors: { origin: '*' } })

app.listen(PORT, () => console.log(`Backend rodando em :${PORT}`))

export default app
```
**Verificar:** `cd backend && npx tsx src/index.ts` — "Backend rodando em :3301"

### 0.6. Criar `web/` — scaffold Vite + React + Tailwind
**Criar:** `web/package.json`
```json
{
  "name": "galaxyship-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 3300",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@galaxyship/shared": "file:../shared",
    "pixi.js": "^8.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.0",
    "vite": "^5.3.0"
  }
}
```
**Criar:** `web/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@galaxyship/shared': '../shared/src/index' }
  },
  server: { port: 3300 }
})
```
**Criar:** `web/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          dark: '#0a0a1a',
          mid:  '#0f0f2e',
          light:'#1a1a4e',
        },
        neon: {
          blue:   '#4FC3F7',
          purple: '#CE93D8',
          green:  '#A5D6A7',
          red:    '#EF9A9A',
          gold:   '#FFD54F',
        }
      },
      fontFamily: {
        game: ['"Exo 2"', 'sans-serif'],
      }
    }
  },
  plugins: []
} satisfies Config
```
**Criar:** `web/src/styles/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&display=swap');

body {
  @apply bg-space-dark text-white font-game;
  overflow: hidden;
  touch-action: none;
}
```
**Verificar:** `cd web && npm install && npm run dev` — página em branco sem erro no console

### 0.7. Criar `web/src/main.tsx` e `web/index.html`
**Criar:** `web/index.html`
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>GalaxyShip</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
**Criar:** `web/src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```
**Criar:** `web/src/App.tsx`
```tsx
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-neon-blue text-2xl">GalaxyShip 🚀</div>} />
    </Routes>
  )
}
```
**Verificar:** browser mostra "GalaxyShip 🚀" em azul neon

### 0x. Commit Fase 0
```bash
git add docker-compose.yml shared/ backend/ web/
git commit -m "chore(issue-1): fase 0 — scaffold monorepo + docker + web + backend (#1)"
```

---

## FASE A — Classes de Entidade (shared/)

### A1. Tipos e enums base
**Criar:** `shared/src/types/enums.ts`
```typescript
export type PlanetType = 'terran' | 'desert' | 'ocean' | 'volcanic' | 'frozen' | 'dead' | 'gas_giant'
export type PlanetSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge'
export type Richness   = 'ultra_poor' | 'poor' | 'abundant' | 'rich' | 'ultra_rich'
export type Gravity    = 'low' | 'normal' | 'high'
export type StarType   = 'yellow' | 'red' | 'blue' | 'white' | 'orange'
export type TechCategory = 'weapons' | 'defense' | 'propulsion' | 'construction' | 'computers' | 'biology'
export type StatKey    = 'production' | 'research' | 'food' | 'growth' | 'diplomacy' | 'attack' | 'defense'
export type TraitKey   = 'creative' | 'diplomatic' | 'militarist' | 'expansionist' | 'industrialist' | 'scientist'
export type OrderType  = 'MOVE_FLEET' | 'COLONIZE' | 'ATTACK' | 'PATROL' | 'SET_RESEARCH' | 'START_BUILD'
export type RelationStatus = 'peace' | 'war' | 'neutral' | 'alliance'
export type BuildingCategory = 'production' | 'research' | 'defense' | 'population' | 'special'
```
**Verificar:** `cd shared && npm run build` sem erros

### A2. Classe base `Entity`
**Criar:** `shared/src/entities/Entity.ts`
```typescript
export interface EntityParams {
  id: string
  name: string
}

export abstract class Entity {
  readonly id: string
  readonly name: string

  constructor(params: EntityParams) {
    this.id   = params.id
    this.name = params.name
  }

  abstract serialize(): Record<string, unknown>

  static deserialize(_data: Record<string, unknown>): Entity {
    throw new Error('Subclass must implement static deserialize()')
  }
}
```
**Verificar:** `npm run build` passa

### A3. Classe abstrata `Race` + interface `RaceActions`
**Criar:** `shared/src/entities/Race.ts`
```typescript
import { Entity, EntityParams } from './Entity'
import type { Planet } from './Planet'
import type { StatKey, TraitKey } from '../types/enums'

export interface RaceParams extends EntityParams {
  description: string
  bonuses:     Partial<Record<StatKey, number>>
  penalties:   Partial<Record<StatKey, number>>
  traits:      TraitKey[]
  color:       string
  homeSystemId?: string
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
  readonly bonuses:     Partial<Record<StatKey, number>>
  readonly penalties:   Partial<Record<StatKey, number>>
  readonly traits:      TraitKey[]
  readonly color:       string
  homeSystemId?: string

  constructor(params: RaceParams) {
    super(params)
    this.description  = params.description
    this.bonuses      = params.bonuses
    this.penalties    = params.penalties
    this.traits       = params.traits
    this.color        = params.color
    this.homeSystemId = params.homeSystemId
  }

  getProductionBonus(): number { return this.bonuses.production ?? 0 }
  getResearchBonus():   number { return this.bonuses.research   ?? 0 }
  getGrowthBonus():     number { return this.bonuses.growth     ?? 0 }

  abstract canDiplomatize(other: Race): boolean
  abstract getDiplomacyModifier(other: Race): number
  abstract canColonizePlanet(planet: Planet): boolean

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, description: this.description,
      bonuses: this.bonuses, penalties: this.penalties,
      traits: this.traits, color: this.color, homeSystemId: this.homeSystemId
    }
  }
}
```
**Verificar:** `npm run build` passa

### A4. Classe abstrata `Planet` + interface `PlanetActions`
**Criar:** `shared/src/entities/Planet.ts`
```typescript
import { Entity, EntityParams } from './Entity'
import type { Race } from './Race'
import type { Colony } from './Colony'
import type { PlanetType, PlanetSize, Richness, Gravity, BuildingCategory } from '../types/enums'

export interface PlanetParams extends EntityParams {
  systemId:  string
  type:      PlanetType
  size:      PlanetSize
  richness:  Richness
  gravity:   Gravity
  radiation: number   // 0-100
}

export interface PlanetActions {
  canColonize(race: Race): boolean
  colonizationCost(race: Race): number
  getMaxPopulation(race: Race): number
  getBaseProduction(): number
  getBaseResearch(): number
  getBaseFood(): number
  canBuild(buildingCategory: BuildingCategory): boolean
}

export abstract class Planet extends Entity implements PlanetActions {
  readonly systemId:  string
  readonly type:      PlanetType
  readonly size:      PlanetSize
  readonly richness:  Richness
  readonly gravity:   Gravity
  readonly radiation: number

  private static readonly SIZE_POP: Record<PlanetSize, number> = {
    tiny: 2, small: 4, medium: 6, large: 8, huge: 10
  }
  private static readonly RICH_PROD: Record<Richness, number> = {
    ultra_poor: 1, poor: 2, abundant: 4, rich: 6, ultra_rich: 8
  }

  constructor(params: PlanetParams) {
    super(params)
    this.systemId  = params.systemId
    this.type      = params.type
    this.size      = params.size
    this.richness  = params.richness
    this.gravity   = params.gravity
    this.radiation = params.radiation
  }

  getBaseProduction(): number { return Planet.RICH_PROD[this.richness] }
  getBaseResearch():   number { return this.type === 'dead' ? 0 : 2 }
  getBaseFood():       number { return this.type === 'terran' ? 4 : this.type === 'ocean' ? 5 : 1 }

  abstract canColonize(race: Race): boolean
  abstract colonizationCost(race: Race): number
  abstract getMaxPopulation(race: Race): number
  abstract canBuild(buildingCategory: BuildingCategory): boolean

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, systemId: this.systemId,
      type: this.type, size: this.size, richness: this.richness,
      gravity: this.gravity, radiation: this.radiation
    }
  }
}
```
**Verificar:** `npm run build` passa

### A5. Classes abstratas `StarSystem`, `Fleet`, `Colony`
**Criar:** `shared/src/entities/StarSystem.ts`
```typescript
import { Entity, EntityParams } from './Entity'
import type { StarType } from '../types/enums'
import type { Fleet } from './Fleet'
import type { Race } from './Race'

export interface StarSystemParams extends EntityParams {
  x:        number   // 0-1 normalizado
  y:        number
  starType: StarType
  wormholeToId?: string
}

export interface StarSystemActions {
  isExplored(byRaceId: string, exploredIds: string[]): boolean
  isColonized(colonies: Record<string, { systemId: string }>): boolean
  getColonizerRaceId(colonies: Record<string, { systemId: string; raceId: string }>): string | null
  distanceTo(other: StarSystem): number
  canBeReachedBy(fleet: Fleet, range: number): boolean
}

export abstract class StarSystem extends Entity implements StarSystemActions {
  readonly x:        number
  readonly y:        number
  readonly starType: StarType
  readonly wormholeToId?: string

  constructor(params: StarSystemParams) {
    super(params)
    this.x           = params.x
    this.y           = params.y
    this.starType    = params.starType
    this.wormholeToId = params.wormholeToId
  }

  distanceTo(other: StarSystem): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2)
  }

  isExplored(byRaceId: string, exploredIds: string[]): boolean {
    return exploredIds.includes(this.id)
  }

  isColonized(colonies: Record<string, { systemId: string }>): boolean {
    return Object.values(colonies).some(c => c.systemId === this.id)
  }

  getColonizerRaceId(colonies: Record<string, { systemId: string; raceId: string }>): string | null {
    const col = Object.values(colonies).find(c => c.systemId === this.id)
    return col?.raceId ?? null
  }

  abstract canBeReachedBy(fleet: Fleet, range: number): boolean

  serialize(): Record<string, unknown> {
    return { id: this.id, name: this.name, x: this.x, y: this.y, starType: this.starType }
  }
}
```
**Criar:** `shared/src/entities/Fleet.ts`
```typescript
import { Entity, EntityParams } from './Entity'
import type { OrderType } from '../types/enums'

export interface FleetParams extends EntityParams {
  raceId:      string
  systemId:    string
  shipCount:   number
  attackPower: number
  defensePower: number
  hasColonist: boolean
  orderType:   OrderType | null
  orderTarget: string | null
}

export interface FleetActions {
  canMoveTo(targetSystemId: string, distance: number, range: number): boolean
  movementRange(): number
  totalAttackPower(): number
  totalDefensePower(): number
  canColonize(): boolean
}

export abstract class Fleet extends Entity implements FleetActions {
  raceId:       string
  systemId:     string
  shipCount:    number
  attackPower:  number
  defensePower: number
  hasColonist:  boolean
  orderType:    OrderType | null
  orderTarget:  string | null

  constructor(params: FleetParams) {
    super(params)
    this.raceId       = params.raceId
    this.systemId     = params.systemId
    this.shipCount    = params.shipCount
    this.attackPower  = params.attackPower
    this.defensePower = params.defensePower
    this.hasColonist  = params.hasColonist
    this.orderType    = params.orderType
    this.orderTarget  = params.orderTarget
  }

  totalAttackPower():  number { return this.attackPower * this.shipCount }
  totalDefensePower(): number { return this.defensePower * this.shipCount }
  canColonize(): boolean      { return this.hasColonist && this.shipCount > 0 }

  abstract canMoveTo(targetSystemId: string, distance: number, range: number): boolean
  abstract movementRange(): number

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, raceId: this.raceId,
      systemId: this.systemId, shipCount: this.shipCount,
      attackPower: this.attackPower, defensePower: this.defensePower,
      hasColonist: this.hasColonist, orderType: this.orderType, orderTarget: this.orderTarget
    }
  }
}
```
**Criar:** `shared/src/entities/Colony.ts`
```typescript
import { Entity, EntityParams } from './Entity'

export interface ColonyParams extends EntityParams {
  systemId:   string
  raceId:     string
  population: number
  buildings:  string[]   // building ids
  buildQueue: string | null
  buildProgress: number
}

export interface ColonyStats {
  production: number
  research:   number
  food:       number
  growth:     number
}

export interface ColonyActions {
  getStats(): ColonyStats
  growthPerTurn(): number
  productionPerTurn(): number
  addBuilding(buildingId: string): void
}

export abstract class Colony extends Entity implements ColonyActions {
  systemId:      string
  raceId:        string
  population:    number
  buildings:     string[]
  buildQueue:    string | null
  buildProgress: number

  constructor(params: ColonyParams) {
    super(params)
    this.systemId      = params.systemId
    this.raceId        = params.raceId
    this.population    = params.population
    this.buildings     = params.buildings
    this.buildQueue    = params.buildQueue
    this.buildProgress = params.buildProgress
  }

  abstract getStats(): ColonyStats
  abstract growthPerTurn(): number
  abstract productionPerTurn(): number

  addBuilding(buildingId: string): void {
    if (!this.buildings.includes(buildingId)) {
      this.buildings.push(buildingId)
    }
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, systemId: this.systemId,
      raceId: this.raceId, population: this.population,
      buildings: this.buildings, buildQueue: this.buildQueue, buildProgress: this.buildProgress
    }
  }
}
```
**Verificar:** `npm run build` passa

### A6. Classes abstratas `Technology` e `Building`
**Criar:** `shared/src/entities/Technology.ts`
```typescript
import { Entity, EntityParams } from './Entity'
import type { TechCategory } from '../types/enums'

export interface TechEffect {
  stat:  string
  value: number
  target: 'fleet' | 'colony' | 'global'
}

export interface TechnologyParams extends EntityParams {
  category:      TechCategory
  tier:          number
  cost:          number
  prerequisites: string[]
  effects:       TechEffect[]
  description:   string
}

export interface TechnologyActions {
  isAvailable(researchedTechs: string[]): boolean
  canResearch(researchedTechs: string[]): boolean
  getDescription(): string
}

export abstract class Technology extends Entity implements TechnologyActions {
  readonly category:      TechCategory
  readonly tier:          number
  readonly cost:          number
  readonly prerequisites: string[]
  readonly effects:       TechEffect[]
  readonly description:   string

  constructor(params: TechnologyParams) {
    super(params)
    this.category      = params.category
    this.tier          = params.tier
    this.cost          = params.cost
    this.prerequisites = params.prerequisites
    this.effects       = params.effects
    this.description   = params.description
  }

  isAvailable(researchedTechs: string[]): boolean {
    return this.prerequisites.every(p => researchedTechs.includes(p))
  }

  canResearch(researchedTechs: string[]): boolean {
    return this.isAvailable(researchedTechs) && !researchedTechs.includes(this.id)
  }

  getDescription(): string { return this.description }

  abstract serialize(): Record<string, unknown>
}
```
**Criar:** `shared/src/entities/Building.ts`
```typescript
import { Entity, EntityParams } from './Entity'
import type { BuildingCategory } from '../types/enums'
import type { Colony, ColonyStats } from './Colony'
import type { Planet } from './Planet'

export interface BuildingEffect {
  stat:  keyof ColonyStats
  flat?: number
  pct?:  number
}

export interface BuildingParams extends EntityParams {
  category:        BuildingCategory
  cost:            number
  maintenanceCost: number
  effects:         BuildingEffect[]
  requirements:    { techIds?: string[]; minPopulation?: number }
  description:     string
}

export interface BuildingActions {
  canBuildOn(planet: Planet, colony: Colony, researchedTechs: string[]): boolean
  getEffectOn(colony: Colony): Partial<ColonyStats>
  getDescription(): string
}

export abstract class Building extends Entity implements BuildingActions {
  readonly category:        BuildingCategory
  readonly cost:            number
  readonly maintenanceCost: number
  readonly effects:         BuildingEffect[]
  readonly requirements:    { techIds?: string[]; minPopulation?: number }
  readonly description:     string

  constructor(params: BuildingParams) {
    super(params)
    this.category        = params.category
    this.cost            = params.cost
    this.maintenanceCost = params.maintenanceCost
    this.effects         = params.effects
    this.requirements    = params.requirements
    this.description     = params.description
  }

  canBuildOn(planet: Planet, colony: Colony, researchedTechs: string[]): boolean {
    const techOk = !this.requirements.techIds ||
      this.requirements.techIds.every(t => researchedTechs.includes(t))
    const popOk = !this.requirements.minPopulation ||
      colony.population >= this.requirements.minPopulation
    return techOk && popOk
  }

  getEffectOn(colony: Colony): Partial<ColonyStats> {
    const result: Partial<ColonyStats> = {}
    for (const e of this.effects) {
      const base = colony.getStats()[e.stat] ?? 0
      result[e.stat] = base + (e.flat ?? 0) + Math.floor(base * (e.pct ?? 0) / 100)
    }
    return result
  }

  getDescription(): string { return this.description }

  serialize(): Record<string, unknown> {
    return { id: this.id, name: this.name, category: this.category, cost: this.cost }
  }
}
```
**Verificar:** `npm run build` passa

### A7. Implementações concretas — `HumanRace`, `ZorgRace`, `SylarRace`
**Criar:** `shared/src/entities/impl/HumanRace.ts`
```typescript
import { Race } from '../Race'
import type { Planet } from '../Planet'

export class HumanRace extends Race {
  constructor(homeSystemId?: string) {
    super({
      id: 'humans',
      name: 'Humanos',
      description: 'Adaptáveis e diplomáticos. Crescem em qualquer planeta habitável.',
      bonuses:   { diplomacy: 25, growth: 10 },
      penalties: { research: -10 },
      traits:    ['creative', 'diplomatic'],
      color:     '#4FC3F7',
      homeSystemId
    })
  }
  canDiplomatize(_other: Race): boolean          { return true }
  getDiplomacyModifier(_other: Race): number     { return 25 }
  canColonizePlanet(planet: Planet): boolean     { return planet.type !== 'dead' && planet.type !== 'gas_giant' }
  static override deserialize(data: Record<string, unknown>): HumanRace {
    const r = new HumanRace(data.homeSystemId as string | undefined)
    return r
  }
}
```
**Criar:** `shared/src/entities/impl/ZorgRace.ts`
```typescript
import { Race } from '../Race'
import type { Planet } from '../Planet'

export class ZorgRace extends Race {
  constructor(homeSystemId?: string) {
    super({
      id: 'zorg',
      name: 'Zorg',
      description: 'Guerreiros implacáveis. Bônus em combate, penalidade diplomática.',
      bonuses:   { attack: 30, defense: 20, production: 10 },
      penalties: { diplomacy: -30, research: -10 },
      traits:    ['militarist', 'industrialist'],
      color:     '#EF9A9A',
      homeSystemId
    })
  }
  canDiplomatize(_other: Race): boolean       { return false }
  getDiplomacyModifier(_other: Race): number  { return -30 }
  canColonizePlanet(planet: Planet): boolean  { return planet.type !== 'gas_giant' }
  static override deserialize(data: Record<string, unknown>): ZorgRace {
    return new ZorgRace(data.homeSystemId as string | undefined)
  }
}
```
**Criar:** `shared/src/entities/impl/SylarRace.ts`
```typescript
import { Race } from '../Race'
import type { Planet } from '../Planet'

export class SylarRace extends Race {
  constructor(homeSystemId?: string) {
    super({
      id: 'sylar',
      name: 'Sylar',
      description: 'Cientistas expansionistas. Colonizam qualquer planeta, incluindo hostis.',
      bonuses:   { research: 30, growth: 20 },
      penalties: { attack: -20, production: -10 },
      traits:    ['scientist', 'expansionist'],
      color:     '#A5D6A7',
      homeSystemId
    })
  }
  canDiplomatize(_other: Race): boolean       { return true }
  getDiplomacyModifier(_other: Race): number  { return 10 }
  canColonizePlanet(_planet: Planet): boolean { return true }
  static override deserialize(data: Record<string, unknown>): SylarRace {
    return new SylarRace(data.homeSystemId as string | undefined)
  }
}
```
**Verificar:** `npm run build` — 0 erros

### A8. Tipos de GameState
**Criar:** `shared/src/types/game.ts`
```typescript
import type { TechCategory, RelationStatus, OrderType } from './enums'

export interface ColonyData {
  id:            string
  name:          string
  systemId:      string
  raceId:        string
  population:    number
  buildings:     string[]
  buildQueue:    string | null
  buildProgress: number
}

export interface FleetData {
  id:           string
  name:         string
  raceId:       string
  systemId:     string
  shipCount:    number
  attackPower:  number
  defensePower: number
  hasColonist:  boolean
  orderType:    OrderType | null
  orderTarget:  string | null
}

export interface PlanetData {
  id:        string
  name:      string
  type:      string
  size:      string
  richness:  string
  gravity:   string
  radiation: number
}

export interface StarSystemData {
  id:       string
  name:     string
  x:        number
  y:        number
  starType: string
  planets:  PlanetData[]
}

export interface DiplomacyRelation {
  raceId:        string
  status:        RelationStatus
  treaties:      string[]
  lastActionTurn: number
}

export interface PlayerResources {
  production: number
  research:   number
  food:       number
  credits:    number
}

export interface GameState {
  turn:            number
  playerRaceId:    string
  systems:         Record<string, StarSystemData>
  colonies:        Record<string, ColonyData>
  fleets:          Record<string, FleetData>
  relations:       Record<string, DiplomacyRelation>
  researchedTechs: string[]
  activeResearch:  { category: TechCategory; pointsAccumulated: number } | null
  resources:       PlayerResources
  exploredSystems: string[]
}

export interface CombatLogLine {
  round:   number
  text:    string
  type:    'attack' | 'defense' | 'result'
}

export interface CombatResult {
  winner:    string    // raceId
  loser:     string
  log:       CombatLogLine[]
  systemId:  string
}

export interface TurnEvent {
  type:     'COMBAT' | 'TECH_UNLOCKED' | 'COLONY_FOUNDED' | 'DIPLOMACY'
  payload:  Record<string, unknown>
}
```
**Atualizar:** `shared/src/index.ts`
```typescript
export * from './entities/Entity'
export * from './entities/Race'
export * from './entities/Planet'
export * from './entities/StarSystem'
export * from './entities/Fleet'
export * from './entities/Colony'
export * from './entities/Technology'
export * from './entities/Building'
export * from './entities/impl/HumanRace'
export * from './entities/impl/ZorgRace'
export * from './entities/impl/SylarRace'
export * from './types/enums'
export * from './types/game'
```
**Verificar:** `npm run build` — 0 erros, `dist/` gerado

### Ax. Commit Fase A
```bash
git add shared/
git commit -m "feat(issue-1): fase A — classes de entidade e tipos do jogo (#1)"
```

---

## FASE B — Backend: API

### B1. Middleware JWT e tipos
**Criar:** `backend/src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'unauthorized' })
  }
}
```
**Verificar:** arquivo criado sem erro de TS

### B2. Rota de autenticação
**Criar:** `backend/src/routes/auth.ts`
```typescript
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

router.post('/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username e password obrigatórios' })
  const hash = await bcrypt.hash(password, 10)
  try {
    const user = await prisma.user.create({ data: { username, passwordHash: hash } })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, userId: user.id, username: user.username })
  } catch {
    res.status(409).json({ error: 'username já existe' })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'credenciais inválidas' })
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, userId: user.id, username: user.username })
})

export default router
```
**Verificar:** `npx tsx src/index.ts` → `POST /api/auth/register` retorna 201 com `curl`

### B3. Gerador de galáxia (shared/logic)
**Criar:** `shared/src/logic/galaxyGenerator.ts`
```typescript
import type { StarSystemData, PlanetData, GameState } from '../types/game'
import type { StarType, PlanetType, PlanetSize, Richness } from '../types/enums'

function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

const STAR_TYPES: StarType[]  = ['yellow', 'red', 'blue', 'white', 'orange']
const PLANET_TYPES: PlanetType[] = ['terran', 'desert', 'ocean', 'volcanic', 'frozen', 'dead']
const SIZES: PlanetSize[]     = ['tiny', 'small', 'medium', 'large', 'huge']
const RICHNESS: Richness[]    = ['ultra_poor', 'poor', 'abundant', 'rich', 'ultra_rich']

const STAR_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
]

export function generateGalaxy(seed: number, systemCount = 55): Record<string, StarSystemData> {
  const rand = seededRandom(seed)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const systems: Record<string, StarSystemData> = {}

  for (let i = 0; i < systemCount; i++) {
    const id = `sys_${i}`
    const planetCount = 1 + Math.floor(rand() * 5)
    const planets: PlanetData[] = []

    for (let p = 0; p < planetCount; p++) {
      planets.push({
        id:        `${id}_p${p}`,
        name:      `${STAR_NAMES[i % STAR_NAMES.length]} ${['I','II','III','IV','V'][p]}`,
        type:      pick(PLANET_TYPES),
        size:      pick(SIZES),
        richness:  pick(RICHNESS),
        gravity:   pick(['low', 'normal', 'high'] as const),
        radiation: Math.floor(rand() * 80)
      })
    }

    systems[id] = {
      id,
      name: `${STAR_NAMES[i % STAR_NAMES.length]} ${Math.floor(i / STAR_NAMES.length) + 1 > 1 ? Math.floor(i / STAR_NAMES.length) + 1 : ''}`.trim(),
      x:        rand(),
      y:        rand(),
      starType: pick(STAR_TYPES),
      planets
    }
  }

  return systems
}
```
**Verificar:** `npm run build` no shared passa

### B4. Rota `/api/game` — criar + carregar + salvar
**Criar:** `backend/src/routes/game.ts`
```typescript
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { generateGalaxy } from '../../../shared/src/logic/galaxyGenerator'
import type { GameState, FleetData, ColonyData, DiplomacyRelation } from '../../../shared/src/types/game'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.post('/new', async (req: AuthRequest, res) => {
  const { raceId } = req.body
  if (!raceId) return res.status(400).json({ error: 'raceId obrigatório' })

  const seed = Math.floor(Math.random() * 1_000_000)
  const systems = generateGalaxy(seed)
  const systemIds = Object.keys(systems)
  const homeSystemId = systemIds[0]

  const homeFleetId = `fleet_${req.userId}_0`
  const homeColonyId = `colony_${homeSystemId}`

  const relations: Record<string, DiplomacyRelation> = {
    zorg:  { raceId: 'zorg',  status: 'neutral', treaties: [], lastActionTurn: 0 },
    sylar: { raceId: 'sylar', status: 'neutral', treaties: [], lastActionTurn: 0 },
  }
  if (raceId === 'zorg')  delete relations.zorg
  if (raceId === 'sylar') delete relations.sylar

  const initialFleet: FleetData = {
    id: homeFleetId, name: 'Frota Inicial',
    raceId, systemId: homeSystemId,
    shipCount: 3, attackPower: 5, defensePower: 5,
    hasColonist: false, orderType: null, orderTarget: null
  }

  const initialColony: ColonyData = {
    id: homeColonyId, name: `${systems[homeSystemId].name} Prime`,
    systemId: homeSystemId, raceId,
    population: 4, buildings: [], buildQueue: null, buildProgress: 0
  }

  const state: GameState = {
    turn: 1,
    playerRaceId: raceId,
    systems,
    colonies: { [homeColonyId]: initialColony },
    fleets: { [homeFleetId]: initialFleet },
    relations,
    researchedTechs: [],
    activeResearch: null,
    resources: { production: 10, research: 5, food: 8, credits: 50 },
    exploredSystems: [homeSystemId]
  }

  const game = await prisma.game.create({
    data: { userId: req.userId!, seed, turnNumber: 1, raceId, stateJson: state as object }
  })

  res.status(201).json({ gameId: game.id, state })
})

router.get('/list', async (req: AuthRequest, res) => {
  const games = await prisma.game.findMany({
    where: { userId: req.userId! },
    select: { id: true, raceId: true, turnNumber: true, createdAt: true, updatedAt: true }
  })
  res.json({ games })
})

router.get('/:id', async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })
  res.json({ gameId: game.id, state: game.stateJson, turn: game.turnNumber })
})

router.put('/:id/save', async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })
  const { state } = req.body
  await prisma.game.update({ where: { id: req.params.id }, data: { stateJson: state } })
  res.json({ ok: true })
})

export default router
```
**Verificar:** `POST /api/game/new` com token válido retorna 201 + sistemas gerados

### B5. Processador de turno (backend/src/services/turnService.ts)
**Criar:** `backend/src/services/turnService.ts`
```typescript
import type { GameState, TurnEvent, FleetData } from '../../../shared/src/types/game'

interface TurnOrder {
  type:          string
  fleetId?:      string
  targetSystemId?: string
  category?:     string
  colonySystemId?: string
  buildingId?:   string
}

interface DiplomacyAction {
  targetRaceId: string
  action:       'DECLARE_WAR' | 'PROPOSE_PEACE' | 'OFFER_TECH'
}

export function processTurn(
  state: GameState,
  orders: TurnOrder[],
  diplomacyActions: DiplomacyAction[]
): { newState: GameState; events: TurnEvent[] } {
  const events: TurnEvent[] = []
  const s: GameState = JSON.parse(JSON.stringify(state))   // deep clone

  // 1. Aplicar ordens do jogador
  for (const order of orders) {
    if (order.type === 'MOVE_FLEET' && order.fleetId && order.targetSystemId) {
      const fleet = s.fleets[order.fleetId]
      if (fleet && fleet.raceId === s.playerRaceId) {
        fleet.systemId   = order.targetSystemId
        fleet.orderType  = null
        fleet.orderTarget = null
        if (!s.exploredSystems.includes(order.targetSystemId)) {
          s.exploredSystems.push(order.targetSystemId)
        }
      }
    }
    if (order.type === 'SET_RESEARCH' && order.category) {
      s.activeResearch = { category: order.category as any, pointsAccumulated: 0 }
    }
  }

  // 2. Acumular pesquisa
  if (s.activeResearch) {
    s.activeResearch.pointsAccumulated += s.resources.research
  }

  // 3. Diplomacia do jogador
  for (const da of diplomacyActions) {
    if (s.relations[da.targetRaceId]) {
      if (da.action === 'DECLARE_WAR')  s.relations[da.targetRaceId].status = 'war'
      if (da.action === 'PROPOSE_PEACE') s.relations[da.targetRaceId].status = 'peace'
    }
  }

  // 4. IA age (simplificada no MVP: mover frota NPC aleatoriamente)
  const npcRaces = ['zorg', 'sylar'].filter(r => r !== s.playerRaceId)
  const systemIds = Object.keys(s.systems)
  for (const npcRaceId of npcRaces) {
    const npcFleets = Object.values(s.fleets).filter(f => f.raceId === npcRaceId)
    for (const fleet of npcFleets) {
      const target = systemIds[Math.floor(Math.random() * systemIds.length)]
      if (target !== fleet.systemId) {
        fleet.systemId = target
      }
    }
  }

  // 5. Verificar combates (frotas de raças diferentes no mesmo sistema)
  const systemFleets: Record<string, FleetData[]> = {}
  for (const fleet of Object.values(s.fleets)) {
    if (!systemFleets[fleet.systemId]) systemFleets[fleet.systemId] = []
    systemFleets[fleet.systemId].push(fleet)
  }
  for (const [systemId, fleets] of Object.entries(systemFleets)) {
    const races = [...new Set(fleets.map(f => f.raceId))]
    if (races.length > 1) {
      const playerFleets = fleets.filter(f => f.raceId === s.playerRaceId)
      const enemyFleets  = fleets.filter(f => f.raceId !== s.playerRaceId)
      if (playerFleets.length && enemyFleets.length) {
        const playerPower = playerFleets.reduce((acc, f) => acc + f.attackPower * f.shipCount, 0)
        const enemyPower  = enemyFleets.reduce((acc, f) => acc + f.attackPower * f.shipCount, 0)
        const winner = playerPower >= enemyPower ? s.playerRaceId : enemyFleets[0].raceId
        events.push({
          type: 'COMBAT',
          payload: { systemId, winner, log: [
            { round: 1, text: `Poder do jogador: ${playerPower} vs inimigo: ${enemyPower}`, type: 'attack' },
            { round: 1, text: `Vitória: ${winner}`, type: 'result' }
          ]}
        })
        if (winner !== s.playerRaceId) {
          for (const f of playerFleets) delete s.fleets[f.id]
        } else {
          for (const f of enemyFleets) delete s.fleets[f.id]
        }
      }
    }
  }

  // 6. Avançar turno
  s.turn += 1

  return { newState: s, events }
}
```
**Criar:** rota `POST /api/game/:id/turn` em `backend/src/routes/game.ts` (adicionar ao arquivo existente):
```typescript
// Adicionar ANTES de `export default router` em game.ts:
router.post('/:id/turn', async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })

  const { orders = [], diplomacyActions = [] } = req.body
  const { processTurn } = await import('../services/turnService')
  const { newState, events } = processTurn(game.stateJson as GameState, orders, diplomacyActions)

  await prisma.game.update({
    where: { id: req.params.id },
    data: { stateJson: newState as object, turnNumber: newState.turn }
  })

  res.json({ state: newState, events })
})
```
**Verificar:** `POST /api/game/:id/turn` retorna 200 com `state.turn === 2`

### B6. Registrar rotas no index.ts e rodar migration
**Editar:** `backend/src/index.ts` — adicionar após `app.use(express.json())`:
```typescript
import authRouter from './routes/auth'
import gameRouter from './routes/game'

app.use('/api/auth', authRouter)
app.use('/api/game', gameRouter)
```
**Rodar:** (com `db` rodando via docker)
```bash
cd backend && DATABASE_URL="postgresql://galaxyship:galaxyship_dev@localhost:55432/galaxyship" npx prisma migrate dev --name init
```
**Verificar:** migration aplicada, tabelas `User` e `Game` criadas

### Bx. Commit Fase B
```bash
git add backend/ shared/src/logic/ shared/src/types/
git commit -m "feat(issue-1): fase B — API Express + Prisma + gerador de galáxia (#1)"
```

---

## FASE C — Biblioteca de Componentes UI

### C1. `Button.tsx`
**Criar:** `web/src/components/ui/Button.tsx`
```tsx
import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  children: React.ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-neon-blue text-space-dark hover:brightness-110 active:brightness-90',
  secondary: 'bg-space-light text-white border border-neon-blue/40 hover:border-neon-blue',
  danger:    'bg-neon-red/20 text-neon-red border border-neon-red/40 hover:bg-neon-red/30',
  ghost:     'bg-transparent text-white hover:bg-white/10',
}
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',   // 44px = touch target mínimo
  lg: 'h-12 px-6 text-lg',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all
        ${VARIANTS[variant]} ${SIZES[size]}
        disabled:opacity-40 disabled:cursor-not-allowed
        min-w-[44px] ${className}`}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  )
}
```
**Verificar:** componente importado em App.tsx sem erro de TS

### C2. `Card.tsx`, `Badge.tsx`, `Spinner.tsx`, `Divider.tsx`, `EmptyState.tsx`
**Criar:** `web/src/components/ui/Card.tsx`
```tsx
interface CardProps { title?: string; footer?: React.ReactNode; className?: string; children: React.ReactNode }
export function Card({ title, footer, className = '', children }: CardProps) {
  return (
    <div className={`bg-space-mid rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {title && <div className="px-4 py-3 border-b border-white/10 font-semibold text-neon-blue">{title}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-white/10">{footer}</div>}
    </div>
  )
}
```
**Criar:** `web/src/components/ui/Badge.tsx`
```tsx
type Variant = 'success' | 'warn' | 'danger' | 'info' | 'neutral'
const V: Record<Variant, string> = {
  success: 'bg-neon-green/20 text-neon-green',
  warn:    'bg-neon-gold/20 text-neon-gold',
  danger:  'bg-neon-red/20 text-neon-red',
  info:    'bg-neon-blue/20 text-neon-blue',
  neutral: 'bg-white/10 text-white/70',
}
export function Badge({ variant = 'neutral', label }: { variant?: Variant; label: string }) {
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${V[variant]}`}>{label}</span>
}
```
**Criar:** `web/src/components/ui/Spinner.tsx`
```tsx
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const S = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return <span className={`inline-block animate-spin rounded-full border-2 border-neon-blue border-t-transparent ${S[size]}`} />
}
```
**Criar:** `web/src/components/ui/Divider.tsx`
```tsx
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-white/10 my-3" />
  return (
    <div className="flex items-center gap-3 my-3">
      <hr className="flex-1 border-white/10" />
      <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
      <hr className="flex-1 border-white/10" />
    </div>
  )
}
```
**Criar:** `web/src/components/ui/EmptyState.tsx`
```tsx
export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {icon && <span className="text-4xl">{icon}</span>}
      <p className="font-semibold text-white/80">{title}</p>
      <p className="text-sm text-white/40">{description}</p>
    </div>
  )
}
```
**Verificar:** todos importam sem erro de TS

### C3. `ProgressBar.tsx`, `ResourceDisplay.tsx`, `Tooltip.tsx`, `IconButton.tsx`, `Modal.tsx`, `Panel.tsx`
**Criar:** `web/src/components/ui/ProgressBar.tsx`
```tsx
export function ProgressBar({ value, color = 'bg-neon-blue', label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-white/60"><span>{label}</span><span>{value}%</span></div>}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}
```
**Criar:** `web/src/components/ui/ResourceDisplay.tsx`
```tsx
export function ResourceDisplay({ icon, value, label, delta }: { icon: string; value: number; label: string; delta?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-xs text-white/40">{label}
          {delta !== undefined && <span className={`ml-1 ${delta >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{delta >= 0 ? '+' : ''}{delta}</span>}
        </div>
      </div>
    </div>
  )
}
```
**Criar:** `web/src/components/ui/Tooltip.tsx`
```tsx
import { useState } from 'react'
export function Tooltip({ content, locked, children }: { content: string; locked?: boolean; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)} onTouchEnd={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-space-light border border-white/20 rounded-lg text-xs whitespace-nowrap z-50">
          {locked ? `🔒 Em breve` : content}
        </div>
      )}
    </div>
  )
}
```
**Criar:** `web/src/components/ui/IconButton.tsx`
```tsx
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string; label: string; size?: 'sm' | 'md' | 'lg'
}
export function IconButton({ icon, label, size = 'md', className = '', ...props }: IconButtonProps) {
  const S = { sm: 'h-9 w-9 text-base', md: 'h-11 w-11 text-xl', lg: 'h-12 w-12 text-2xl' }
  return (
    <button {...props} aria-label={label}
      className={`flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/20 transition-colors ${S[size]} ${className}`}>
      {icon}
    </button>
  )
}
```
**Criar:** `web/src/components/ui/Modal.tsx`
```tsx
import { useEffect } from 'react'
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-space-mid rounded-2xl border border-white/15 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-lg text-neon-blue">{title}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
```
**Criar:** `web/src/components/ui/Panel.tsx`
```tsx
export function Panel({ open, onClose, position = 'bottom', title, children }: {
  open: boolean; onClose: () => void; position?: 'bottom' | 'right'; title?: string; children: React.ReactNode
}) {
  if (!open) return null
  const isBottom = position === 'bottom'
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute bg-space-mid border-white/15 shadow-2xl overflow-y-auto
        ${isBottom
          ? 'bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[80vh]'
          : 'top-0 right-0 bottom-0 w-full md:w-96 border-l'}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-space-mid">
            <h3 className="font-bold text-neon-blue">{title}</h3>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
```
**Criar:** `web/src/components/ui/index.ts` (barrel export)
```typescript
export * from './Button'
export * from './Card'
export * from './Badge'
export * from './Spinner'
export * from './Divider'
export * from './EmptyState'
export * from './ProgressBar'
export * from './ResourceDisplay'
export * from './Tooltip'
export * from './IconButton'
export * from './Modal'
export * from './Panel'
```
**Verificar:** `npm run build` no web sem erros de TS

### C4. `LockedFeature.tsx`
**Criar:** `web/src/components/game/LockedFeature.tsx`
```tsx
import { Tooltip } from '../ui'

export function LockedFeature({ label, reason, children }: { label: string; reason?: string; children?: React.ReactNode }) {
  return (
    <Tooltip content={reason || 'Em desenvolvimento'} locked>
      <div className="relative opacity-40 cursor-not-allowed select-none pointer-events-none">
        {children || (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm">
            🔒 <span>{label}</span>
          </div>
        )}
      </div>
    </Tooltip>
  )
}
```
**Verificar:** `npm run build` passa

### Cx. Commit Fase C
```bash
git add web/src/components/
git commit -m "feat(issue-1): fase C — biblioteca de componentes UI e game (#1)"
```

---

## FASE D — Zustand Store + API + Auth Frontend

### D1. Auth store e API
**Criar:** `web/src/api/authApi.ts`
```typescript
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3301/api'

export interface AuthResponse { token: string; userId: string; username: string }

export async function apiRegister(username: string, password: string): Promise<AuthResponse> {
  const r = await fetch(`${BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiLogin(username: string, password: string): Promise<AuthResponse> {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}
```
**Criar:** `web/src/store/authStore.ts`
```typescript
import { create } from 'zustand'

interface AuthState {
  token:    string | null
  userId:   string | null
  username: string | null
  setAuth:  (token: string, userId: string, username: string) => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null, userId: null, username: null,
  setAuth: (token, userId, username) => set({ token, userId, username }),
  logout: () => set({ token: null, userId: null, username: null }),
}))
```
**Verificar:** `npm run build` passa

### D2. Game API e store
**Criar:** `web/src/api/gameApi.ts`
```typescript
import type { GameState, TurnEvent } from '@galaxyship/shared'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3301/api'

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export async function apiCreateGame(token: string, raceId: string): Promise<{ gameId: string; state: GameState }> {
  const r = await fetch(`${BASE}/game/new`, { method: 'POST', headers: headers(token), body: JSON.stringify({ raceId }) })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiLoadGame(token: string, gameId: string): Promise<{ gameId: string; state: GameState; turn: number }> {
  const r = await fetch(`${BASE}/game/${gameId}`, { headers: headers(token) })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiEndTurn(token: string, gameId: string, orders: object[], diplomacy: object[]): Promise<{ state: GameState; events: TurnEvent[] }> {
  const r = await fetch(`${BASE}/game/${gameId}/turn`, {
    method: 'POST', headers: headers(token), body: JSON.stringify({ orders, diplomacyActions: diplomacy })
  })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiListGames(token: string) {
  const r = await fetch(`${BASE}/game/list`, { headers: headers(token) })
  return r.json()
}
```
**Criar:** `web/src/store/gameStore.ts`
```typescript
import { create } from 'zustand'
import type { GameState, TurnEvent } from '@galaxyship/shared'

interface GameStore {
  gameId:         string | null
  state:          GameState | null
  selectedSystem: string | null
  activePanel:    string | null
  pendingEvents:  TurnEvent[]
  processingTurn: boolean
  setGame:        (gameId: string, state: GameState) => void
  updateState:    (state: GameState) => void
  selectSystem:   (id: string | null) => void
  openPanel:      (panel: string | null) => void
  setEvents:      (events: TurnEvent[]) => void
  setProcessing:  (v: boolean) => void
  reset:          () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameId: null, state: null, selectedSystem: null,
  activePanel: null, pendingEvents: [], processingTurn: false,
  setGame:      (gameId, state) => set({ gameId, state }),
  updateState:  (state)        => set({ state }),
  selectSystem: (id)           => set({ selectedSystem: id }),
  openPanel:    (panel)        => set({ activePanel: panel }),
  setEvents:    (events)       => set({ pendingEvents: events }),
  setProcessing: (v)           => set({ processingTurn: v }),
  reset:        ()             => set({ gameId: null, state: null, selectedSystem: null }),
}))
```
**Verificar:** `npm run build` passa

### D3. Telas de Auth (Login/Register) e HomePage
**Criar:** `web/src/pages/LoginPage.tsx`
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { apiLogin, apiRegister } from '../api/authApi'

export function LoginPage() {
  const [mode, setMode]     = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth  = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? apiLogin : apiRegister
      const data = await fn(username, password)
      setAuth(data.token, data.userId, data.username)
      navigate('/game/new')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-dark p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-neon-blue mb-2">🚀 GalaxyShip</h1>
        <p className="text-center text-white/40 mb-8">Conquiste a galáxia</p>
        <form onSubmit={handleSubmit} className="bg-space-mid rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex gap-2 mb-2">
            <Button variant={mode === 'login' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setMode('login')} type="button">Entrar</Button>
            <Button variant={mode === 'register' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setMode('register')} type="button">Registrar</Button>
          </div>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Usuário" autoComplete="username"
            className="w-full h-11 px-4 rounded-lg bg-space-dark border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Senha" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full h-11 px-4 rounded-lg bg-space-dark border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue" />
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```
**Verificar:** tela renderiza no browser em `/login`

### Dx. Commit Fase D
```bash
git add web/src/store/ web/src/api/ web/src/pages/LoginPage.tsx
git commit -m "feat(issue-1): fase D — store Zustand + API functions + tela de auth (#1)"
```

---

## FASE E — Componentes de Jogo + Telas de Raça e Jogo

### E1. Componentes de jogo (game/)
**Criar:** `web/src/components/game/RaceCard.tsx`
```tsx
import type { RaceParams } from '@galaxyship/shared'
import { Badge, Card } from '../ui'

interface RaceCardProps { race: RaceParams; selected?: boolean; onSelect?: () => void }

export function RaceCard({ race, selected, onSelect }: RaceCardProps) {
  return (
    <button onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all
        ${selected ? 'border-neon-blue bg-neon-blue/10' : 'border-white/10 bg-space-mid hover:border-white/30'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full" style={{ backgroundColor: race.color }} />
        <div>
          <div className="font-bold">{race.name}</div>
          <div className="text-xs text-white/50">{race.traits.join(' · ')}</div>
        </div>
      </div>
      <p className="text-sm text-white/60 mb-3">{race.description}</p>
      <div className="flex flex-wrap gap-1">
        {Object.entries(race.bonuses).map(([k, v]) => (
          <Badge key={k} variant="success" label={`+${v} ${k}`} />
        ))}
        {Object.entries(race.penalties).map(([k, v]) => (
          <Badge key={k} variant="danger" label={`${v} ${k}`} />
        ))}
      </div>
    </button>
  )
}
```
**Criar:** `web/src/components/game/TurnCounter.tsx`
```tsx
export function TurnCounter({ turn }: { turn: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-sm">Turno</span>
      <span className="font-bold text-neon-gold text-lg">{turn}</span>
    </div>
  )
}
```
**Criar:** `web/src/components/game/ResourceHUD.tsx`
```tsx
import type { PlayerResources } from '@galaxyship/shared'
import { ResourceDisplay } from '../ui'

export function ResourceHUD({ resources }: { resources: PlayerResources }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <ResourceDisplay icon="⚙️" value={resources.production} label="Produção" />
      <ResourceDisplay icon="🔬" value={resources.research}   label="Pesquisa" />
      <ResourceDisplay icon="🌾" value={resources.food}       label="Comida" />
      <ResourceDisplay icon="💰" value={resources.credits}    label="Créditos" />
    </div>
  )
}
```
**Criar:** `web/src/components/game/CombatLogEntry.tsx`
```tsx
import type { CombatLogLine } from '@galaxyship/shared'

export function CombatLogEntry({ entry }: { entry: CombatLogLine }) {
  const colors = { attack: 'text-neon-red', defense: 'text-neon-blue', result: 'text-neon-gold' }
  return (
    <p className={`text-sm py-1 ${colors[entry.type]}`}>
      <span className="text-white/30 mr-2">R{entry.round}.</span>{entry.text}
    </p>
  )
}
```
**Criar:** `web/src/components/game/ColonyStats.tsx`
```tsx
import { ProgressBar } from '../ui'
import type { ColonyData } from '@galaxyship/shared'

export function ColonyStats({ colony }: { colony: ColonyData }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/60">População</span>
        <span>{colony.population}</span>
      </div>
      <ProgressBar value={colony.population * 10} label="Produção" color="bg-neon-gold" />
      <ProgressBar value={colony.buildProgress} label="Construção" color="bg-neon-blue" />
    </div>
  )
}
```
**Criar:** `web/src/components/game/index.ts`
```typescript
export * from './RaceCard'
export * from './TurnCounter'
export * from './ResourceHUD'
export * from './CombatLogEntry'
export * from './ColonyStats'
export * from './LockedFeature'
```
**Verificar:** `npm run build` passa

### E2. Tela de seleção de raça
**Criar:** `web/src/pages/RaceSelectPage.tsx`
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HumanRace, ZorgRace, SylarRace } from '@galaxyship/shared'
import { RaceCard } from '../components/game'
import { Button } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { apiCreateGame } from '../api/gameApi'

const RACES = [new HumanRace(), new ZorgRace(), new SylarRace()]

export function RaceSelectPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const token   = useAuthStore(s => s.token)
  const setGame = useGameStore(s => s.setGame)
  const navigate = useNavigate()

  async function handleStart() {
    if (!selected || !token) return
    setLoading(true)
    try {
      const { gameId, state } = await apiCreateGame(token, selected)
      setGame(gameId, state)
      navigate(`/game/${gameId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-space-dark p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-neon-blue mb-2">Escolha sua Raça</h1>
      <p className="text-white/40 mb-6 text-sm">Cada raça tem habilidades únicas que definem sua estratégia</p>
      <div className="w-full max-w-2xl space-y-3 mb-6">
        {RACES.map(race => (
          <RaceCard key={race.id} race={race} selected={selected === race.id} onSelect={() => setSelected(race.id)} />
        ))}
      </div>
      {error && <p className="text-neon-red text-sm mb-3">{error}</p>}
      <Button onClick={handleStart} loading={loading} disabled={!selected} size="lg">
        Iniciar Partida →
      </Button>
    </div>
  )
}
```
**Verificar:** tela exibe 3 raças; seleção muda o estilo do card

### E3. Estrutura do GameScreen (placeholder para canvas)
**Criar:** `web/src/pages/GameScreen.tsx`
```tsx
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { apiLoadGame } from '../api/gameApi'
import { HUDOverlay } from '../panels/HUDOverlay'
import { GalaxyMapCanvas } from '../canvas/GalaxyMapCanvas'
import { Spinner } from '../components/ui'

export function GameScreen() {
  const { id }   = useParams<{ id: string }>()
  const token    = useAuthStore(s => s.token)
  const state    = useGameStore(s => s.state)
  const setGame  = useGameStore(s => s.setGame)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (!state && id) {
      apiLoadGame(token, id).then(data => setGame(data.gameId, data.state))
    }
  }, [id, token])

  if (!state) return (
    <div className="min-h-screen bg-space-dark flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-space-dark overflow-hidden">
      <GalaxyMapCanvas />
      <HUDOverlay />
    </div>
  )
}
```
**Atualizar:** `web/src/App.tsx` com rotas reais:
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage }      from './pages/LoginPage'
import { RaceSelectPage } from './pages/RaceSelectPage'
import { GameScreen }     from './pages/GameScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Navigate to="/login" />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/game/new" element={<RaceSelectPage />} />
      <Route path="/game/:id" element={<GameScreen />} />
    </Routes>
  )
}
```
**Verificar:** navegação entre rotas funciona; `/game/:id` mostra spinner enquanto carrega

### Ex. Commit Fase E
```bash
git add web/src/pages/ web/src/components/game/ web/src/App.tsx
git commit -m "feat(issue-1): fase E — telas de seleção de raça e estrutura do GameScreen (#1)"
```

---

## FASE F — Canvas Pixi.js (Mapa da Galáxia)

### F1. PixiApp singleton
**Criar:** `web/src/canvas/PixiApp.ts`
```typescript
import { Application, Container } from 'pixi.js'

let _app: Application | null = null

export async function getPixiApp(canvas: HTMLCanvasElement): Promise<Application> {
  if (_app) return _app
  _app = new Application()
  await _app.init({
    canvas,
    resizeTo: canvas.parentElement!,
    background: 0x0a0a1a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  })
  return _app
}

export function destroyPixiApp() {
  _app?.destroy(false)
  _app = null
}
```
**Verificar:** arquivo criado sem erro de TS

### F2. Layer de estrelas (`StarsLayer.ts`)
**Criar:** `web/src/canvas/layers/StarsLayer.ts`
```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { StarSystemData } from '@galaxyship/shared'

const STAR_COLORS: Record<string, number> = {
  yellow: 0xFFD54F, red: 0xEF9A9A, blue: 0x4FC3F7, white: 0xFFFFFF, orange: 0xFFB74D
}

export class StarsLayer extends Container {
  private starGraphics: Map<string, { g: Graphics; t: Text; pulsePhase: number }> = new Map()

  render(systems: Record<string, StarSystemData>, exploredIds: string[], width: number, height: number) {
    this.removeChildren()
    this.starGraphics.clear()

    for (const sys of Object.values(systems)) {
      const explored = exploredIds.includes(sys.id)
      const px = sys.x * width
      const py = sys.y * height
      const color = explored ? (STAR_COLORS[sys.starType] ?? 0xffffff) : 0x444466

      const g = new Graphics()
      g.circle(0, 0, explored ? 6 : 3).fill({ color, alpha: explored ? 1 : 0.4 })
      g.circle(0, 0, explored ? 12 : 6).fill({ color, alpha: 0.1 })
      g.x = px; g.y = py
      g.eventMode = 'static'
      g.cursor    = 'pointer'

      const label = new Text({
        text: explored ? sys.name : '???',
        style: new TextStyle({ fill: explored ? 0xffffff : 0x555577, fontSize: 10, fontFamily: 'Exo 2, sans-serif' })
      })
      label.x = px + 10; label.y = py - 6

      this.addChild(g, label)
      this.starGraphics.set(sys.id, { g, t: label, pulsePhase: Math.random() * Math.PI * 2 })
    }
  }

  tick(elapsed: number) {
    for (const { g, pulsePhase } of this.starGraphics.values()) {
      const alpha = 0.8 + 0.2 * Math.sin(elapsed * 0.002 + pulsePhase)
      g.alpha = alpha
    }
  }

  onStarClick(systemId: string, callback: (id: string) => void) {
    const entry = this.starGraphics.get(systemId)
    if (entry) entry.g.on('pointerdown', () => callback(systemId))
  }
}
```
**Verificar:** arquivo criado sem erro de TS

### F3. Layer de nebulosas (`NebulaeLayer.ts`)
**Criar:** `web/src/canvas/layers/NebulaeLayer.ts`
```typescript
import { Container, Graphics } from 'pixi.js'

export class NebulaeLayer extends Container {
  render(seed: number, width: number, height: number) {
    this.removeChildren()
    let s = seed
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }

    const colors = [0x1a0a3a, 0x0a1a3a, 0x0a2a1a, 0x2a0a1a]
    for (let i = 0; i < 8; i++) {
      const g = new Graphics()
      const cx = rand() * width
      const cy = rand() * height
      const rx = 80 + rand() * 180
      const ry = 50 + rand() * 120
      const color = colors[Math.floor(rand() * colors.length)]
      g.ellipse(cx, cy, rx, ry).fill({ color, alpha: 0.12 + rand() * 0.1 })
      this.addChild(g)
    }
  }
}
```
**Verificar:** arquivo criado sem erro de TS

### F4. `GalaxyMapCanvas.tsx` — componente principal do canvas
**Criar:** `web/src/canvas/GalaxyMapCanvas.tsx`
```tsx
import { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'
import { getPixiApp, destroyPixiApp } from './PixiApp'
import { StarsLayer }   from './layers/StarsLayer'
import { NebulaeLayer } from './layers/NebulaeLayer'
import { useGameStore } from '../store/gameStore'

export function GalaxyMapCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const appRef       = useRef<Application | null>(null)
  const starsRef     = useRef<StarsLayer | null>(null)
  const nebulaeRef   = useRef<NebulaeLayer | null>(null)
  const viewportRef  = useRef<Container | null>(null)
  const state        = useGameStore(s => s.state)
  const selectSystem = useGameStore(s => s.selectSystem)

  useEffect(() => {
    if (!canvasRef.current || !state) return
    let mounted = true

    getPixiApp(canvasRef.current).then(app => {
      if (!mounted) return
      appRef.current = app

      const viewport = new Container()
      viewportRef.current = viewport
      app.stage.addChild(viewport)

      const nebulae = new NebulaeLayer()
      const stars   = new StarsLayer()
      nebulaeRef.current = nebulae
      starsRef.current   = stars
      viewport.addChild(nebulae, stars)

      const { width, height } = app.screen
      nebulae.render(42, width, height)
      stars.render(state.systems, state.exploredSystems, width, height)

      // Registrar cliques nas estrelas
      Object.keys(state.systems).forEach(id => {
        stars.onStarClick(id, () => selectSystem(id))
      })

      // Touch/drag no viewport
      let dragging = false, lastX = 0, lastY = 0
      app.canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY })
      app.canvas.addEventListener('pointermove', e => {
        if (!dragging) return
        viewport.x += e.clientX - lastX
        viewport.y += e.clientY - lastY
        lastX = e.clientX; lastY = e.clientY
      })
      app.canvas.addEventListener('pointerup', () => { dragging = false })

      // Animação de pulso
      app.ticker.add(ticker => {
        stars.tick(ticker.lastTime)
      })
    })

    return () => {
      mounted = false
      destroyPixiApp()
    }
  }, [!!state])   // recria só quando state vai de null → definido

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
}
```
**Verificar:** mapa aparece no browser com estrelas coloridas e fundo nebuloso

### Fx. Commit Fase F
```bash
git add web/src/canvas/
git commit -m "feat(issue-1): fase F — canvas Pixi.js com estrelas e nebulosas (#1)"
```

---

## FASE G — Painéis React (HUD, Colony, Tech, Diplomacy, Combat)

### G1. `HUDOverlay.tsx`
**Criar:** `web/src/panels/HUDOverlay.tsx`
```tsx
import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { TurnCounter, ResourceHUD } from '../components/game'
import { Button, IconButton, Spinner } from '../components/ui'
import { apiEndTurn } from '../api/gameApi'
import { ColonyPanel }    from './ColonyPanel'
import { TechTreePanel }  from './TechTreePanel'
import { DiplomacyPanel } from './DiplomacyPanel'
import { CombatModal }    from './CombatModal'

export function HUDOverlay() {
  const state         = useGameStore(s => s.state)
  const gameId        = useGameStore(s => s.gameId)
  const processing    = useGameStore(s => s.processingTurn)
  const pendingEvents = useGameStore(s => s.pendingEvents)
  const updateState   = useGameStore(s => s.updateState)
  const setEvents     = useGameStore(s => s.setEvents)
  const setProcessing = useGameStore(s => s.setProcessing)
  const token         = useAuthStore(s => s.token)
  const [openPanel, setOpenPanel] = useState<string | null>(null)

  if (!state || !token || !gameId) return null

  const combatEvent = pendingEvents.find(e => e.type === 'COMBAT')

  async function handleEndTurn() {
    setProcessing(true)
    try {
      const { state: newState, events } = await apiEndTurn(token, gameId, [], [])
      updateState(newState)
      setEvents(events)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      {/* HUD superior */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto bg-space-dark/90 backdrop-blur border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
          <TurnCounter turn={state.turn} />
          <ResourceHUD resources={state.resources} />
          <div className="flex items-center gap-2">
            <IconButton icon="🔬" label="Tecnologia" onClick={() => setOpenPanel('tech')} />
            <IconButton icon="🤝" label="Diplomacia" onClick={() => setOpenPanel('diplomacy')} />
          </div>
        </div>
      </div>

      {/* Botão Fim de Turno (inferior centro) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
        <Button onClick={handleEndTurn} loading={processing} size="lg"
          className="shadow-[0_0_20px_rgba(79,195,247,0.3)]">
          {processing ? 'Processando...' : '⏭ Fim de Turno'}
        </Button>
      </div>

      {/* Painéis */}
      <ColonyPanel    open={openPanel === 'colony'} onClose={() => setOpenPanel(null)} />
      <TechTreePanel  open={openPanel === 'tech'}   onClose={() => setOpenPanel(null)} />
      <DiplomacyPanel open={openPanel === 'diplomacy'} onClose={() => setOpenPanel(null)} />
      {combatEvent && (
        <CombatModal open onClose={() => setEvents(pendingEvents.filter(e => e.type !== 'COMBAT'))}
          event={combatEvent} />
      )}
    </>
  )
}
```
**Verificar:** HUD aparece sobre o mapa com recursos e botão de fim de turno

### G2. `ColonyPanel.tsx`
**Criar:** `web/src/panels/ColonyPanel.tsx`
```tsx
import { Panel, ProgressBar, EmptyState } from '../components/ui'
import { ColonyStats } from '../components/game'
import { useGameStore } from '../store/gameStore'

export function ColonyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state          = useGameStore(s => s.state)
  const selectedSystem = useGameStore(s => s.selectedSystem)

  const colony = selectedSystem && state
    ? Object.values(state.colonies).find(c => c.systemId === selectedSystem)
    : null

  return (
    <Panel open={open} onClose={onClose} title="Colônia" position="bottom">
      {!colony ? (
        <EmptyState title="Nenhuma colônia selecionada" description="Toque em um planeta colonizado no mapa" icon="🌍" />
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">{colony.name}</h3>
          <ColonyStats colony={colony} />
          <div>
            <p className="text-sm text-white/40 mb-2">Edifícios</p>
            {colony.buildings.length === 0
              ? <p className="text-sm text-white/30">Nenhum edifício construído</p>
              : colony.buildings.map(b => <div key={b} className="text-sm py-1">{b}</div>)
            }
          </div>
          {colony.buildQueue && (
            <div>
              <p className="text-sm text-white/40 mb-1">Construindo</p>
              <ProgressBar value={colony.buildProgress} label={colony.buildQueue} color="bg-neon-gold" />
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
```
**Verificar:** painel abre em bottom-sheet com dados da colônia

### G3. `TechTreePanel.tsx`
**Criar:** `web/src/panels/TechTreePanel.tsx`
```tsx
import { Panel } from '../components/ui'
import { LockedFeature } from '../components/game'
import { useGameStore } from '../store/gameStore'

const TECH_CATEGORIES = ['weapons', 'defense', 'propulsion', 'construction', 'computers', 'biology'] as const
const CATEGORY_ICONS: Record<string, string> = {
  weapons: '⚔️', defense: '🛡️', propulsion: '🚀', construction: '🏗️', computers: '💻', biology: '🧬'
}
const CATEGORY_LABELS: Record<string, string> = {
  weapons: 'Armas', defense: 'Defesa', propulsion: 'Propulsão',
  construction: 'Construção', computers: 'Computadores', biology: 'Biologia'
}

export function TechTreePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore(s => s.state)

  return (
    <Panel open={open} onClose={onClose} title="🔬 Árvore de Tecnologias" position="right">
      <p className="text-sm text-white/40 mb-4">
        Pesquisa ativa: <span className="text-neon-blue">{state?.activeResearch?.category ?? 'Nenhuma'}</span>
      </p>
      <div className="space-y-3">
        {TECH_CATEGORIES.map(cat => (
          <div key={cat} className="bg-space-dark rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
              {state?.activeResearch?.category === cat && (
                <span className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded-full">Pesquisando</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5].map(tier => (
                <LockedFeature key={tier} label={`Nível ${tier}`}>
                  <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center text-xs text-white/40">{tier}</div>
                </LockedFeature>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
```
**Verificar:** painel exibe categorias com nós de tech bloqueados (🔒)

### G4. `DiplomacyPanel.tsx` e `CombatModal.tsx`
**Criar:** `web/src/panels/DiplomacyPanel.tsx`
```tsx
import { Panel, Badge, Button } from '../components/ui'
import { useGameStore } from '../store/gameStore'

const RACE_LABELS: Record<string, { name: string; color: string }> = {
  zorg:  { name: 'Zorg',  color: '#EF9A9A' },
  sylar: { name: 'Sylar', color: '#A5D6A7' },
}
const STATUS_VARIANT: Record<string, any> = { peace: 'success', war: 'danger', neutral: 'neutral', alliance: 'info' }

export function DiplomacyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore(s => s.state)
  const relations = state ? Object.values(state.relations) : []

  return (
    <Panel open={open} onClose={onClose} title="🤝 Diplomacia" position="right">
      {relations.length === 0
        ? <p className="text-sm text-white/40">Nenhuma raça conhecida ainda.</p>
        : relations.map(rel => (
          <div key={rel.raceId} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: RACE_LABELS[rel.raceId]?.color }} />
              <div>
                <div className="font-medium">{RACE_LABELS[rel.raceId]?.name ?? rel.raceId}</div>
                <Badge variant={STATUS_VARIANT[rel.status]} label={rel.status} />
              </div>
            </div>
            <div className="flex gap-1">
              {rel.status !== 'war'   && <Button variant="danger"    size="sm" onClick={() => {}}>⚔️ Guerra</Button>}
              {rel.status === 'war'   && <Button variant="secondary" size="sm" onClick={() => {}}>🕊 Paz</Button>}
            </div>
          </div>
        ))
      }
    </Panel>
  )
}
```
**Criar:** `web/src/panels/CombatModal.tsx`
```tsx
import { Modal } from '../components/ui'
import { CombatLogEntry } from '../components/game'
import type { TurnEvent, CombatLogLine } from '@galaxyship/shared'

export function CombatModal({ open, onClose, event }: { open: boolean; onClose: () => void; event: TurnEvent }) {
  const payload = event.payload as { winner: string; log: CombatLogLine[]; systemId: string }
  return (
    <Modal open={open} onClose={onClose} title="⚔️ Combate">
      <p className="text-sm text-white/50 mb-3">Sistema: <span className="text-white">{payload.systemId}</span></p>
      <div className="bg-space-dark rounded-xl p-4 space-y-1 mb-4 max-h-48 overflow-y-auto">
        {payload.log.map((entry, i) => <CombatLogEntry key={i} entry={entry} />)}
      </div>
      <div className={`text-center font-bold text-lg ${payload.winner === 'humans' ? 'text-neon-green' : 'text-neon-red'}`}>
        {payload.winner === 'humans' ? '🏆 Vitória!' : '💀 Derrota'}
      </div>
    </Modal>
  )
}
```
**Verificar:** modal de combate abre quando há evento de combate no turno

### Gx. Commit Fase G
```bash
git add web/src/panels/
git commit -m "feat(issue-1): fase G — HUD overlay + painéis Colony, Tech, Diplomacy, Combat (#1)"
```

---

## FASE H — Integração, Polish e Mobile

### H1. Conectar clique no mapa ao ColonyPanel
**Editar:** `web/src/canvas/GalaxyMapCanvas.tsx` — dentro do `getPixiApp().then(...)`:
Substituir comentário de clique por:
```typescript
// Após stars.render(...):
Object.keys(state.systems).forEach(id => {
  stars.onStarClick(id, (sysId) => {
    selectSystem(sysId)
    // Abre ColonyPanel se houver colônia no sistema
    const hasColony = Object.values(state.colonies).some(c => c.systemId === sysId)
    if (hasColony) useGameStore.getState().openPanel('colony')
  })
})
```
**Verificar:** tap em sistema colonizado abre ColonyPanel com dados

### H2. Pinch-to-zoom no canvas (mobile)
**Editar:** `web/src/canvas/GalaxyMapCanvas.tsx` — adicionar após listener de pointerup:
```typescript
let lastPinchDist = 0
app.canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    lastPinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
  }
})
app.canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    const scale = viewport.scale.x * (dist / lastPinchDist)
    viewport.scale.set(Math.max(0.3, Math.min(3, scale)))
    lastPinchDist = dist
  }
})
```
**Verificar:** pinch-zoom funciona em modo mobile do Chrome DevTools

### H3. Criar `docs/ARCHITECTURE.md`
**Criar:** `docs/ARCHITECTURE.md`
```markdown
# Arquitetura — GalaxyShip

## Containers

| Container | Porta | Tecnologia | Responsabilidade |
|-----------|-------|-----------|-----------------|
| `db`      | 55432 | PostgreSQL 16 | Persistência de usuários e saves de jogo |
| `backend` | 3301  | Node.js/Express/Prisma | API REST, lógica de turno, auth JWT |
| `web`     | 3300  | React/Vite/Pixi.js | Cliente web (SPA), canvas, UI painéis |

## Comunicação

```
web (3300) ──HTTP/JSON──► backend (3301) ──Prisma──► db (55432)
                           ↑
                     shared/ (npm local)
                     (entidades + lógica)
```

## Multiplayer (futuro)
- `socket.io` no backend (comentado em `backend/src/index.ts`)
- Cada partida terá `roomId`; jogadores se conectam ao room
- Estado do jogo vive no servidor (backend é fonte de verdade)

## Shared Package
O pacote `@galaxyship/shared` contém as classes de entidade e lógica de jogo.
Backend e frontend o importam como dependência local — única fonte de verdade.
```
**Verificar:** arquivo criado

### H4. `CHANGELOG.md` inicial
**Criar:** `docs/CHANGELOG.md`
```markdown
# Changelog — GalaxyShip

## [0.1.0] — 2026-06-15

### Adicionado
- Scaffold monorepo (shared + backend + web + docker-compose)
- Sistema de classes de entidade: Entity, Race, Planet, StarSystem, Fleet, Colony, Technology, Building
- Implementações concretas: HumanRace, ZorgRace, SylarRace
- API backend: auth (register/login JWT), game (new/load/turn/save)
- Gerador de galáxia procedural baseado em seed
- Biblioteca de componentes UI reutilizáveis (Button, Card, Modal, Panel, etc.)
- Componentes de jogo (RaceCard, ColonyStats, ResourceHUD, etc.)
- Canvas Pixi.js com mapa da galáxia (estrelas pulsantes, nebulosas)
- Painéis: HUD, Colony, TechTree, Diplomacy, CombatModal
- Telas: Login/Register, RaceSelect, GameScreen
- Save/Load via PostgreSQL (stateJson)
- Mobile: bottom-sheet panels, pinch-zoom no mapa, touch targets ≥44px
```
**Verificar:** arquivo criado

### H5. Atualizar issue no GitHub
```bash
cat > /tmp/galaxyship/sdd-issue-update.md << 'EOF'
## Objetivo
Construir do zero o jogo GalaxyShip — 4X espacial turn-based inspirado em Master of Orion, rodando no browser com suporte mobile-first.

## Abordagem
Pixi.js para mapa da galáxia em WebGL + React/Tailwind para painéis + Zustand para estado + Express/PostgreSQL para save e base de multiplayer futuro.

## Critérios de sucesso
- [ ] Galáxia renderiza com visual impactante no canvas
- [ ] Jogador move frotas e funda colônias (touch + mouse)
- [ ] Turno avança com IA agindo
- [ ] Save/Load funciona
- [ ] Roda no iPhone Safari e Android Chrome sem bugs

## Spec
- Spec: `docs/sdd/ISSUE_1/02-spec.md`
- Tasks: `docs/sdd/ISSUE_1/03-tasks.md`

## Links
- Design: `docs/sdd/ISSUE_1/00-design.md`

## Status SDD
- [x] 00-design.md
- [x] 02-spec.md
- [x] 03-tasks.md
- [ ] Implementado (/sdd-execute)
- [ ] 04-acceptance.md
EOF
gh issue edit 1 --repo rjcaubit/galaxyship --body-file /tmp/galaxyship/sdd-issue-update.md
```
**Verificar:** `gh issue view 1 --repo rjcaubit/galaxyship` mostra status atualizado

### Hx. Commit Fase H + push
```bash
git add docs/
git commit -m "feat(issue-1): fase H — integração, polish, docs ARCHITECTURE + CHANGELOG (#1)"
git push origin master
```

---

## FASE I — Teste E2E (CT05)

### I1. Executar jornada E2E
Seguir sequência do CT05 em `02-spec.md`:
1. `docker compose up -d` e aguardar `GET /health` retornar 200
2. Abrir `http://localhost:3300/` — screenshot
3. Registrar usuário → selecionar raça Humanos → iniciar partida → screenshot do mapa
4. Clicar em estrela home → ColonyPanel → screenshot
5. Abrir TechTree → screenshot (categorias com 🔒)
6. Apertar "Fim de Turno" → aguardar → screenshot (turno 2)
7. Abrir DevTools → mobile 375px → repetir steps 3-6 → screenshots

**Salvar:** screenshots em `docs/test-results/issue-1-e2e/`
**Criar:** `docs/test-results/issue-1-e2e/README.md` com lista de testes passando/falhando

### Ix. Commit final
```bash
git add docs/test-results/
git commit -m "test(issue-1): resultados E2E — jornada completa (#1)"
git push origin master
```
