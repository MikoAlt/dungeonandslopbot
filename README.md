# Dungeon & Slop Bot

A Discord RPG dungeon crawler bot with LLM-powered narrative, dual RPG systems, multiplayer support, and MCP-based story management.

## Features

- **Dual RPG Systems** — D&D 5e-like stats (STR/DEX/CON/INT/WIS/CHA + hit dice) and Custom Simple system (STR/DEX/INT + AC/speed)
- **Three Multiplayer Modes** — Shared Session (real-time), Persistent World (long-running), Async Collaboration (play-by-post)
- **LLM-Powered Narrative** — OpenAI-compatible endpoint with OpenRouter fallback, 32k context budget with automatic compression
- **MCP Internal API** — Story and campaign management exposed as Model Context Protocol tools and resources
- **Discord Embeds UI** — All output rendered as rich Discord embeds with automatic pagination for long content
- **Combat System** — Initiative tracking, attack/defend/cast/end, persistent to PostgreSQL
- **Dice Engine** — Standard notation (`2d6+3`), advantage/disadvantage, keep highest/lowest, exploding dice, seeded PRNG
- **Command Queue & Rate Limiting** — Per-user FIFO queue with token-bucket rate limiting

## Tech Stack

| Layer         | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| Runtime       | [Bun](https://bun.sh)                                             |
| Language      | TypeScript (strict mode)                                          |
| Discord       | [discord.js v14](https://discord.js.org/)                         |
| Database      | PostgreSQL + [Prisma](https://www.prisma.io/) ORM                 |
| Vector Search | pgvector extension                                                |
| LLM           | [LangChain.js](https://js.langchain.com/) + OpenAI-compatible API |
| MCP           | [@modelcontextprotocol/sdk](https://modelcontextprotocol.io/)     |
| Validation    | [Zod](https://zod.dev)                                            |
| Testing       | Bun test runner                                                   |
| Deployment    | Docker Compose                                                    |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- PostgreSQL >= 16 (or Docker)
- Node.js >= 22 (for Prisma CLI)

### 1. Clone and Install

```bash
git clone <repo-url>
cd dungeonandslopbot
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable             | Required | Description                                                                            |
| -------------------- | -------- | -------------------------------------------------------------------------------------- |
| `DISCORD_TOKEN`      | Yes      | Discord bot token from [Developer Portal](https://discord.com/developers/applications) |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                                                           |
| `LLM_API_URL`        | Yes      | OpenAI-compatible API endpoint (e.g., `https://api.openai.com/v1`)                     |
| `LLM_API_KEY`        | Yes      | API key for the LLM endpoint                                                           |
| `LLM_MODEL_NAME`     | Yes      | Model name (e.g., `gpt-4`)                                                             |
| `OPENROUTER_API_KEY` | No       | OpenRouter key for model routing fallback                                              |

### 3. Set Up Database

```bash
bunx prisma migrate dev
bunx prisma generate
```

### 4. Deploy Slash Commands

```bash
bun run src/deploy-commands.ts
```

### 5. Run the Bot

```bash
# Development (with hot reload)
bun run dev

# Production
bun run build
bun run start
```

## Docker Deployment

```bash
# Build and start
bun run docker:build
bun run docker:up

# View logs
bun run docker:logs

# Stop
bun run docker:down

# Restart
bun run docker:restart
```

The Docker Compose stack includes:

- **bot** — The Discord bot service
- **postgres** — PostgreSQL 16 with pgvector extension, health-checked

## Slash Commands

### Character Management — `/character`

| Subcommand          | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `/character create` | Create a new character (name, class, system: dnd5e/custom, backstory) |
| `/character sheet`  | View your character sheet (optional: character-id)                    |
| `/character list`   | List all your characters                                              |
| `/character update` | Update a character (add-item, remove-item, backstory)                 |
| `/character delete` | Delete a character (requires confirmation)                            |

### Campaign Management — `/campaign`

| Subcommand         | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `/campaign create` | Create a new campaign (name, system, mode, description) |
| `/campaign join`   | Join an existing campaign                               |
| `/campaign leave`  | Leave a campaign                                        |
| `/campaign status` | View campaign status (optional: campaign-id)            |
| `/campaign end`    | End a campaign (DM only)                                |

### Story — `/story-advance`, `/story-summary`

| Command          | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `/story-advance` | Advance the story with a player action (campaign-id, action) |
| `/story-summary` | Get a summary of the campaign story (campaign-id)            |

### Gameplay — `/dice`, `/explore`, `/combat`, `/skill-check`, `/inventory`

| Command             | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `/dice roll`        | Roll dice using notation (e.g., `2d6+3`), with advantage/disadvantage |
| `/explore`          | Explore the world and interact with the story                         |
| `/combat start`     | Start a combat encounter                                              |
| `/combat attack`    | Attack a target in combat                                             |
| `/combat defend`    | Take a defensive stance                                               |
| `/combat cast`      | Cast a spell or ability                                               |
| `/combat end`       | End the combat encounter                                              |
| `/skill-check`      | Make a skill check (skill name, optional modifier)                    |
| `/inventory list`   | List inventory items                                                  |
| `/inventory add`    | Add an item to inventory                                              |
| `/inventory remove` | Remove an item from inventory                                         |
| `/inventory use`    | Use an item from inventory                                            |

### Utility

| Command | Description                    |
| ------- | ------------------------------ |
| `/ping` | Check if the bot is responsive |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Discord Bot                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Commands │  │  Events  │  │  Embed Renderers │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │                  │             │
│  ┌────┴──────────────┴──────────────────┴─────────┐   │
│  │              AppContainer (DI)                  │   │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │  Services  │ │  Repos   │ │  Utilities   │  │   │
│  │  │  Character │ │  Base    │ │  Logger      │  │   │
│  │  │  Campaign  │ │  Char    │ │  Queue       │  │   │
│  │  │  Story     │ │  Camp    │ │  RateLimiter │  │   │
│  │  │  LLM Orch  │ │  Story   │ │  Dice       │  │   │
│  │  │  Context   │ │  Message │ │  Math       │  │   │
│  │  │  RPG Engine│ │  Embed   │ │  Random     │  │   │
│  │  │  Multiplay │ │  Combat  │ │             │  │   │
│  │  └────────────┘ └──────────┘ └──────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│       │              │                                  │
│  ┌────┴─────┐  ┌─────┴──────┐                          │
│  │ MCP      │  │ LangChain  │                          │
│  │ Server   │  │ + OpenAI   │                          │
│  └──────────┘  └────────────┘                          │
└─────────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐          ┌────┴────┐
    │  MCP    │          │  LLM    │
    │  Stdio  │          │  API    │
    └─────────┘          └─────────┘
         │
    ┌────┴────────────┐
    │   PostgreSQL    │
    │   + pgvector    │
    └─────────────────┘
```

### Key Design Decisions

- **Dependency Injection** — `AppContainer` in `src/wiring.ts` wires all services and passes them to commands via `execute(interaction, services?)`
- **No In-Memory Game State** — All game state (characters, campaigns, combat) persists in PostgreSQL
- **Context Compression** — 32k token budget split: 2k system + 4k world state + 10k recent messages + 12k RAG + 4k headroom
- **MCP as Internal API** — Story and campaign management exposed as MCP tools/resources for external integration
- **Embed Pagination** — `EmbedPaginator` auto-splits content at 6000 chars / 25 fields per Discord limits

## Project Structure

```
src/
├── commands/           # Slash command handlers
│   ├── campaign/       # /campaign create, join, leave, status, end
│   ├── character/      # /character create, sheet, list, update, delete
│   ├── gameplay/       # /dice, /explore, /combat, /skill-check, /inventory
│   ├── story/          # /story-advance, /story-summary
│   └── ping.ts         # /ping
├── config/             # Environment validation (Zod)
├── db/
│   ├── prisma.ts       # Prisma client singleton
│   └── repositories/   # Data access layer (BaseRepository<T> pattern)
├── embeds/
│   ├── builder.ts      # Base embed builder with themes
│   ├── paginator.ts    # Auto-splitting embed pagination
│   └── renderers/      # Character sheet, campaign, story, battle, dice
├── events/             # Discord event handlers (ready, interactionCreate, error)
├── handlers/           # Command and event routing
├── mcp/                # Model Context Protocol server
│   ├── server.ts       # MCP server setup
│   ├── tools.ts        # Tool registration
│   ├── resources.ts    # Resource registration
│   ├── handlers.ts     # Tool/resource handlers
│   └── types.ts        # Zod schemas for MCP I/O
├── services/
│   ├── character.ts     # Character CRUD, stats, inventory
│   ├── campaign.ts      # Campaign management
│   ├── story.ts         # Story advancement
│   ├── campaign/state.ts # In-memory campaign cache
│   ├── context/         # Token counting, compression, budget
│   ├── llm/             # LLM client, orchestrator, chains, memory, prompts
│   ├── multiplayer/     # Shared session, persistent world, async handlers
│   ├── rpg/             # D&D 5e engine, custom engine, dice, math
│   ├── queue.ts         # Per-user command queue
│   └── rate-limiter.ts  # Token bucket rate limiting
├── types/              # Zod schemas and TypeScript types
├── utils/              # Logger, random utilities
├── wiring.ts           # DI container (AppContainer)
└── index.ts            # Entry point
```

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/services/character.test.ts

# Run tests matching a pattern
bun test --test-name-pattern "character"
```

The project uses Bun's built-in test runner with `vi` mocking. Tests are located in `tests/` mirroring the `src/` structure.

## Development

### Available Scripts

| Script                   | Description           |
| ------------------------ | --------------------- |
| `bun run dev`            | Start with hot reload |
| `bun run build`          | Build for production  |
| `bun run start`          | Run production build  |
| `bun test`               | Run test suite        |
| `bun run lint`           | Lint with ESLint      |
| `bun run migrate`        | Run Prisma migrations |
| `bun run docker:build`   | Build Docker images   |
| `bun run docker:up`      | Start Docker stack    |
| `bun run docker:down`    | Stop Docker stack     |
| `bun run docker:logs`    | View bot logs         |
| `bun run docker:restart` | Restart bot container |

### Adding a New Slash Command

1. Create a file in `src/commands/<category>/`
2. Export a `Command` object with `data` (SlashCommandBuilder) and `execute(interaction, services?)`
3. Register it in `src/commands/<category>/index.ts`
4. Add it to `src/deploy-commands.ts`
5. Write tests in `tests/commands/<category>/`

### Adding a New MCP Tool

1. Define Zod input/output schemas in `src/mcp/types.ts`
2. Register the tool in `src/mcp/tools.ts`
3. Implement the handler in `src/mcp/handlers.ts`
4. Write tests in `tests/mcp/`

## License

Private — personal project for friends.
