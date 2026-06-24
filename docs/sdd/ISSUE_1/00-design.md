# Design — feat: MVP jogo 4X espacial GalaxyShip (solo + base multiplayer)

**Data:** 2026-06-15
**Status:** Proposto (aprovado)
**Tipo:** feature (projeto novo)

## Problema

Projeto do zero. Objetivo: construir um jogo 4X espacial turn-based no browser, inspirado em Master of Orion, com visual moderno e impactante, rodando bem no celular (touch-first) e preparado para multiplayer futuro.

## Usuário e caso de uso

Jogador solo jogando no browser (desktop ou mobile). Inicia uma partida, escolhe raça, explora a galáxia turn a turn, expande colônias, pesquisa tecnologias, combate frotas inimigas (IA rule-based) e tenta dominar a galáxia. Saves persistidos no banco para retomar depois.

## Escopo

### Inclui (MVP)
- Tela de nova partida: escolher 1 raça jogável (com atributos únicos)
- Mapa da galáxia gerado proceduralmente (estrelas, nebulosas)
- Sistema de turnos: mover frotas, colonizar sistemas
- Gestão de colônia: produção, população, construção de edifícios/naves
- Árvore de tecnologia básica (desbloqueio por turnos de pesquisa)
- Combate espacial automático (resolve com log animado)
- IA adversária: 2-3 raças NPC com FSM (expansionista, defensiva, agressiva)
- Diplomacia básica: paz, guerra, troca de tecnologia
- Save/Load no PostgreSQL (1 save por usuário)
- UI mobile-first: touch drag no mapa, painéis bottom-sheet no mobile
- Features futuras visíveis mas bloqueadas (ícone 🔒 + tooltip "Em breve")

### Não inclui (fora do escopo desta issue)
- Multiplayer (arquitetura prevista, não implementada)
- Designer de naves customizadas
- Combate tático em grid
- Múltiplos saves por usuário
- Sons e trilha sonora
- Modo campanha com narrativa

## Abordagem escolhida

**Pixi.js (mapa galáxia) + React (UI painéis) + Zustand (estado) + Node.js/Express (backend)**

O mapa da galáxia — coração visual do jogo — é renderizado em WebGL via Pixi.js: estrelas com brilho pulsante, nebulosas coloridas, rotas de frota animadas. Toda a UI (painéis de colônia, tech tree, diplomacia, HUD de turno) é React puro com Tailwind, flutuando sobre o canvas.

O estado do jogo vive no Zustand (client) e é persistido via Express+PostgreSQL ao fim de cada turno. Isso isola a lógica de jogo dos componentes e prepara o terreno para WebSockets no multiplayer.

## Abordagens descartadas

| Abordagem | Motivo de descarte |
|-----------|---------------------|
| Phaser 3 full engine | UI rica briga com o paradigma do Phaser; visual "app moderno" fica difícil |
| SVG/CSS puro | Animações e efeitos espaciais muito limitados para o visual desejado |

## Impacto arquitetural

### Estrutura de pastas (monorepo)
```
galaxyship/
├── web/          # React + Pixi.js + Zustand + Tailwind
├── backend/      # Node.js/Express + TypeScript + Prisma
├── shared/       # tipos e constantes compartilhados
└── docker-compose.yml
```

### Backend (Node.js/Express/TypeScript)
- `POST /api/auth/login` — auth minimalista (JWT)
- `POST /api/game/new` — cria partida, gera galáxia com seed
- `GET  /api/game/:id` — carrega save
- `POST /api/game/:id/turn` — processa turno (move IA, resolve combate)

### Frontend (React/TypeScript)
- `GalaxyMapCanvas` — Pixi.js, renderiza estrelas/rotas/frotas
- `HUDOverlay` — React, turno atual, recursos, botão "Fim de Turno"
- `ColonyPanel` — React, bottom-sheet mobile / sidebar desktop
- `TechTreePanel` — árvore visual de tecnologias
- `DiplomacyPanel` — relações com NPCs
- `CombatLogModal` — animação de resultado de batalha

### Schema (alto nível)
- `users` — id, username, created_at
- `games` — id, seed, turno_atual, estado_json, user_id, created_at
- Estado do jogo serializado como JSON (galáxia + frotas + colônias + relações)

### Docs a criar
- CODEMAP.md, ARCHITECTURE.md, docker-compose.yml

## Critérios de sucesso
- [ ] Galáxia renderiza com visual impactante no canvas (estrelas, nebulosas)
- [ ] Jogador move frotas entre sistemas (touch + mouse)
- [ ] Colônia fundada mostra painel de gestão (bottom-sheet no mobile)
- [ ] Turno avança: NPC age, recursos são calculados
- [ ] Combate ocorre e exibe log animado
- [ ] Save/Load funciona (partida retoma do mesmo ponto)
- [ ] Roda sem bugs no iPhone Safari e Android Chrome

## Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Pixi.js + React conflito de ciclo de vida | média | Usar ref para canvas, nunca deixar React recriar o elemento |
| Performance no mobile mid-range | média | Limitar partículas, usar sprite batching no Pixi |
| Complexidade do estado crescer rápido | alta | Definir interfaces TypeScript rígidas em /shared desde o dia 1 |

## Próximo passo
→ `/sdd-plan 1` para gerar spec técnica detalhada + tasks granulares
