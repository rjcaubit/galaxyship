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

## Shared Package
O pacote `@galaxyship/shared` contém as classes de entidade (Entity → Race, Planet,
StarSystem, Fleet, Colony, Technology, Building) e a lógica de jogo (gerador de galáxia).
Backend e frontend o importam como dependência local (`file:../shared`) — única fonte
de verdade. O frontend resolve via alias Vite para `shared/src/index.ts`; o backend
consome o build (`shared/dist`) gerado por `npm run build`.

## Estado do Jogo
Cada partida é uma linha em `Game` com `stateJson` (JSONB) contendo o `GameState`
completo: sistemas, colônias, frotas, relações diplomáticas, pesquisa e recursos.
O turno é processado server-side (`backend/src/services/turnService.ts`), garantindo
que o servidor seja a fonte de verdade — base para o multiplayer futuro.

## Multiplayer (futuro)
- `socket.io` no backend (placeholder comentado em `backend/src/index.ts`)
- Cada partida terá `roomId`; jogadores conectam ao room
- Estado já vive no servidor, então a migração é incremental

## Padrões de arquitetura
- **Entidades como classes** com interface `*Actions` definindo o contrato antes da
  implementação concreta. Nova raça/planeta = nova subclasse, sem alterar a lógica.
- **Componentes UI** (`web/src/components/ui/`) são puros e reutilizáveis: sem store,
  sem lógica de jogo, touch target ≥44px.
- **Componentes de jogo** (`web/src/components/game/`) recebem entidades via props.
- **Canvas Pixi.js** criado uma única vez via `useRef`, nunca recriado pelo React.
