# Dungeon and Slop — Discord RPG Bot

## TL;DR

> **Quick Summary**: Build a Discord RPG dungeon crawler bot using discord.js v14 + TypeScript, with LangChain.js for LLM orchestration, MCP as internal API layer for Story/Campaign management, PostgreSQL + pgvector for persistence and semantic search, and dual RPG systems (D&D 5e + Custom Simple) across three multiplayer modes.
>
> **Deliverables**:
>
> - Discord bot with slash commands and embeds-based UI
> - Character Management System (create, level up, inventory, stats)
> - Story/Campaign Management System (MCP-based internal API)
> - LLM integration via OpenAI-compatible endpoint (custom + OpenRouter)
> - Context compression pipeline (32k budget: system + world state + recent + RAG)
> - Dual RPG system engine (D&D 5e-like + Custom Simple)
> - Three multiplayer modes (shared session, persistent world, async)
> - Docker Compose deployment
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: T1 (project scaffold) → T3 (types/schema) → T5 (DB + repository) → T8 (character service) → T10 (context manager) → T13 (campaign/story engine) → T15 (LLM integration) → T18 (embed renderer) → T20 (multiplayer modes) → T23 (integration) → F1-F4

---

## Context

### Original Request

Build a Discord bot called "Dungeon and Slop" — an RPG dungeon crawler with Discord embeds-based UI, OpenAI-compatible endpoint, multiplayer character management, story/campaign management exposed as MCP, and 32k max context with compression. Personal project for friends.

### Interview Summary

**Key Discussions**:

- **Language**: TypeScript + Node.js with discord.js v14 (native ecosystem for Discord + MCP)
- **LLM Endpoint**: Custom API + OpenRouter option, not OpenAI direct
- **Multiplayer**: All three modes combined — shared session, persistent world, async collaboration
- **RPG System**: Dual-mode — D&D 5e-like AND Custom Simple system
- **Database**: PostgreSQL + pgvector (structured data + vector embeddings for RAG)
- **Framework**: LangChain.js for LLM orchestration, tools, memory management
- **MCP**: Hybrid — LangChain Tools for LLM interaction, MCP as internal API for Story/Campaign
- **Commands**: Slash-only (no prefix commands)
- **Testing**: TDD approach
- **Deployment**: Docker Compose (bot + DB + MCP)
- **Scope**: All rendering in Discord embeds, no web dashboard/music/monetization/mobile
- **RPG Mode Switch**: User undecided — wants to revisit later (all options interesting)

**Research Findings**:

- discord.js v14: SlashCommandBuilder + EmbedBuilder, per-file command pattern, deferReply() for >3s responses
- MCP SDK: @modelcontextprotocol/sdk, McpServer class, StdioServerTransport, Zod schemas for tools/resources
- LangChain.js: Tool/ToolNode for structured LLM calls, BufferMemory + VectorStoreRetrieverMemory for context
- Context compression: 2k system + 4k world state + 10k recent + ~12k dynamic/RAG + 4k headroom
- Discord embed limits: 6000 chars total, 25 fields, title 256, description 4096, field value 1024

### Metis Review

**Identified Gaps** (addressed):

- **Embed limits**: Implement EmbedPaginator (Avrae pattern) for auto-splitting long content — ADDED as guardrail
- **deferReply() pattern**: ALL LLM-invoking commands must use deferReply() + editReply() — ADDED as guardrail
- **Ephemeral locking**: Decide public vs private per command upfront, cannot switch mid-interaction — ADDED as guardrail
- **Thread auto-archive**: Use regular channels, not threads, for persistent world — ADDED as guardrail
- **Cross-shard state**: Keep game state in PostgreSQL, not in-memory — ADDED as architecture rule
- **Concurrent commands**: Per-user command queue to prevent race conditions — ADDED as guardrail
- **MCP overhead**: MCP as internal module is worth it for clean separation + future external exposure — RESOLVED
- **RPG mode switch**: Per-campaign toggle (safest) — APPLIED as default, user can revisit later
- **DM isolation**: Guild channels for shared state, DMs for private data (character sheets, secret rolls) — ADDED as pattern

---

## Work Objectives

### Core Objective

Build a Discord RPG bot that lets friends play dungeon crawler adventures together, powered by LLM-generated narratives, with dual rule systems and multiple modes of multiplayer interaction.

### Concrete Deliverables

- `src/` — Complete TypeScript bot source code
- `src/commands/` — Slash commands (character, campaign, story, dice, etc.)
- `src/services/` — Character, Campaign, Story, Context, LLM services
- `src/mcp/` — MCP server for story/campaign internal API
- `src/embeds/` — Embed builder utilities including EmbedPaginator
- `src/db/` — PostgreSQL + pgvector repositories
- `docker-compose.yml` — Full deployment stack
- `tests/` — TDD test suite

### Definition of Done

- [ ] Bot responds to `/campaign create`, `/character create`, `/story advance` etc.
- [ ] Character creation works in both D&D 5e and Custom Simple modes
- [ ] Story/campaign data persists in PostgreSQL across bot restarts
- [ ] LLM generates narrative responses within 32k context budget
- [ ] EmbedPaginator correctly splits content exceeding Discord limits
- [ ] All 3 multiplayer modes functional (shared session, persistent world, async)
- [ ] MCP server starts and responds to tool/resource calls
- [ ] Docker Compose brings up entire stack (`docker compose up`)
- [ ] `bun test` passes all tests
- [ ] Context compression keeps tokens under 28k (leaving 4k headroom)

### Must Have

- Slash commands for all user interactions
- EmbedPaginator for all embed rendering
- deferReply() for any command that calls LLM
- PostgreSQL for ALL persistent game state (no in-memory state)
- LangChain.js memory management with token counting
- MCP server as internal API for story/campaign operations
- Dual RPG system engine (D&D 5e stats + Custom Simple stats)
- Context compression pipeline (sliding window + summaries + RAG)
- Docker Compose deployment
- TDD: tests written before implementation

### Must NOT Have (Guardrails)

- NO web dashboard/UI — all rendering in Discord embeds
- NO prefix commands (like `!command`) — slash-only
- NO music/voice channel features
- NO monetization/premium tiers
- NO mobile companion app
- NO in-memory game state (all state in PostgreSQL)
- NO mixing public and ephemeral in same interaction
- NO threads for persistent world campaigns (use regular channels)
- NO real-time combat engine (start DM-orchestrated turn-based)
- NO AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp)
- NO hardcoding config values — use environment variables or config files

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: NO (new project)
- **Automated tests**: YES (TDD)
- **Framework**: `bun test` (Vitest-compatible)
- **TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Discord Bot**: Use `bun test` for unit/integration tests. For live testing, use Discord test guild.
- **MCP Server**: Use `bun test` for tool/resource tests. Stdio transport testable via JSON-RPC calls.
- **Database**: Use testcontainers or SQLite in-memory for tests. Real PostgreSQL in Docker for QA.
- **LLM Integration**: Mock OpenAI-compatible endpoint in tests. Real endpoint in QA scenarios.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + scaffolding):
├── T1: Project scaffolding + config [quick]
├── T2: Discord bot core + slash command handler [quick]
├── T3: Shared types + Zod schemas [quick]
├── T4: DB schema + Prisma setup [quick]
├── T5: Embed utilities + EmbedPaginator [quick]
└── T6: MCP server scaffold [quick]

Wave 2 (After Wave 1 — data layer + core services):
├── T7: DB repositories (character, campaign, story) [unspecified-high]
├── T8: Character service (create, stats, inventory) [deep]
├── T9: RPG system engine (D&D 5e + Custom Simple) [deep]
├── T10: Context manager (token counting, compression) [deep]
├── T11: MCP tools/resources registration [unspecified-high]
└── T12: LangChain.js integration + tools setup [unspecified-high]

Wave 3 (After Wave 2 — gameplay + interaction):
├── T13: Campaign/story engine service [deep]
├── T14: LLM orchestration service [deep]
├── T15: Dice + math engine [quick]
├── T16: Embed renderer (character sheets, campaign status, battle UI) [visual-engineering]
└── T17: Command queue + rate limiter [quick]

Wave 4 (After Wave 3 — features + integration):
├── T18: Multiplayer mode handlers (shared session, persistent world, async) [deep]
├── T19: Slash commands — character management [unspecified-high]
├── T20: Slash commands — campaign + story [unspecified-high]
└── T21: Slash commands — gameplay (dice, explore, combat) [unspecified-high]

Wave 5 (After Wave 4 — final integration + Docker):
├── T22: End-to-end integration + bot wiring [deep]
└── T23: Docker Compose + deployment config [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On             | Blocks             | Wave |
| ---- | ---------------------- | ------------------ | ---- |
| T1   | —                      | T2, T3, T4, T5, T6 | 1    |
| T2   | T1                     | T19, T20, T21      | 1    |
| T3   | T1                     | T8, T9, T10, T11   | 1    |
| T4   | T1                     | T7, T11            | 1    |
| T5   | T1                     | T16                | 1    |
| T6   | T1                     | T11                | 1    |
| T7   | T4                     | T8, T13            | 2    |
| T8   | T3, T7                 | T19                | 2    |
| T9   | T3                     | T19, T21           | 2    |
| T10  | T3                     | T14                | 2    |
| T11  | T3, T4, T6             | T13                | 2    |
| T12  | T3                     | T14                | 2    |
| T13  | T7, T11                | T20                | 3    |
| T14  | T10, T12               | T20, T21           | 3    |
| T15  | T3                     | T21                | 3    |
| T16  | T5                     | T19, T20           | 3    |
| T17  | T2                     | T18, T21           | 3    |
| T18  | T17, T13, T9           | T22                | 4    |
| T19  | T8, T9, T16            | T22                | 4    |
| T20  | T13, T14, T16          | T22                | 4    |
| T21  | T9, T15, T14, T16, T17 | T22                | 4    |
| T22  | T18, T19, T20, T21     | T23                | 5    |
| T23  | T22                    | F1-F4              | 5    |

### Agent Dispatch Summary

- **Wave 1**: 6 tasks — T1→T4: `quick`, T5: `quick`, T6: `quick`
- **Wave 2**: 6 tasks — T7: `unspecified-high`, T8: `deep`, T9: `deep`, T10: `deep`, T11: `unspecified-high`, T12: `unspecified-high`
- **Wave 3**: 5 tasks — T13: `deep`, T14: `deep`, T15: `quick`, T16: `visual-engineering`, T17: `quick`
- **Wave 4**: 4 tasks — T18: `deep`, T19: `unspecified-high`, T20: `unspecified-high`, T21: `unspecified-high`
- **Wave 5**: 2 tasks — T22: `deep`, T23: `quick`
- **FINAL**: 4 tasks — F1: `oracle`, F2: `unspecified-high`, F3: `unspecified-high`, F4: `deep`

---

## TODOs

- [x] 1. Project Scaffolding + Config

  **What to do**:
  - Initialize Node.js project with TypeScript, Bun runtime
  - Install core dependencies: `discord.js`, `@langchain/core`, `langchain`, `@modelcontextprotocol/sdk`, `zod`, `@prisma/client`, `pg`
  - Install dev dependencies: `bun test`, `typescript`, `eslint`, `prettier`, `@types/node`
  - Create `tsconfig.json` with strict mode, ES2022 target, Node22 module resolution
  - Create project directory structure: `src/commands/`, `src/events/`, `src/services/`, `src/db/`, `src/mcp/`, `src/embeds/`, `src/types/`, `src/utils/`, `src/config/`, `tests/`
  - Create `.env.example` with: `DISCORD_TOKEN`, `DATABASE_URL`, `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL_NAME`, `OPENROUTER_API_KEY` (optional)
  - Create `docker-compose.yml` skeleton with `bot`, `postgres`, services placeholder
  - Create `package.json` scripts: `dev`, `build`, `start`, `test`, `lint`, `migrate`
  - Create `.gitignore`, `.eslintrc.json`, `.prettierrc`
  - Create `src/config/index.ts` that loads and validates env vars with Zod
  - Write TDD tests for config validation first

  **Must NOT do**:
  - Do NOT install database drivers for MySQL/MongoDB (PostgreSQL only)
  - Do NOT set up Prisma yet (that's T4)
  - Do NOT create any command/event handler logic (that's T2)
  - Do NOT hardcode any config values — all via env vars

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding is well-defined, mechanical setup work
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `git-master` (no git operations needed yet)

  **Parallelization**:
  - **Can Run In Parallel**: NO — all Wave 2+ tasks depend on project structure
  - **Parallel Group**: Wave 1
  - **Blocks**: T2, T3, T4, T5, T6
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - discord.js v14 project structure — see `https://discordjs.guide/creating-your-bot/` for canonical layout
  - LangChain.js project setup — see `https://js.langchain.com/docs/get_started/installation` for dependency list
  - MCP SDK setup — see `https://modelcontextprotocol.io/docs/develop/build-server` for TypeScript project init

  **API/Type References**:
  - `discord.js` v14 — `Client`, `GatewayIntentBits`, `SlashCommandBuilder`
  - `@modelcontextprotocol/sdk` — `McpServer`, `StdioServerTransport`
  - `zod` — schema validation for config and MCP tool inputs

  **External References**:
  - Bun test framework: `https://bun.sh/docs/cli/test`
  - Prisma with PostgreSQL: `https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/postgresql`

  **WHY Each Reference Matters**:
  - discord.js guide ensures correct project structure from day one
  - LangChain.js docs list exact packages needed (not just `langchain` umbrella)
  - MCP SDK docs confirm the `@modelcontextprotocol/sdk` package name and import paths
  - Bun test — project will use Bun as runtime, must use Bun test runner

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/config.test.ts`
  - [ ] `bun test tests/config.test.ts` → PASS (config validates env vars, rejects missing required vars)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Project scaffolding initializes correctly
    Tool: Bash
    Preconditions: Empty directory at /home/miko/workspace/dungeonandslopbot (except .agents/)
    Steps:
      1. Run `bun install` in project root
      2. Assert `node_modules/` directory exists and contains `discord.js`, `langchain`, `@modelcontextprotocol/sdk`, `zod`, `@prisma/client`
      3. Run `bun run build`
      4. Assert exit code 0
      5. Run `bun test`
      6. Assert test output shows config validation tests passing
    Expected Result: Install succeeds, build succeeds, tests pass
    Failure Indicators: `bun install` fails, `node_modules/` missing key packages, build errors, test failures
    Evidence: .sisyphus/evidence/task-1-scaffold-init.txt

  Scenario: Config validation rejects missing env vars
    Tool: Bash
    Preconditions: Empty .env (no DISCORD_TOKEN set)
    Steps:
      1. Run `bun test tests/config.test.ts`
      2. Assert test for "missing DISCORD_TOKEN throws error" passes
      3. Run `DISCORD_TOKEN=test DATABASE_URL=postgresql://test LLM_API_URL=http://test LLM_API_KEY=test bun test tests/config.test.ts`
      4. Assert all config validation tests pass
    Expected Result: Missing required vars throw Zod validation errors, valid config loads successfully
    Failure Indicators: Config loads without error when DISCORD_TOKEN is empty
    Evidence: .sisyphus/evidence/task-1-config-validation.txt
  ```

  **Evidence to Capture**:
  - [ ] task-1-scaffold-init.txt
  - [ ] task-1-config-validation.txt

  **Commit**: YES (group with T1)
  - Message: `feat(init): scaffold project with TypeScript, discord.js, and config`
  - Files: `package.json`, `tsconfig.json`, `.env.example`, `src/config/index.ts`, `tests/config.test.ts`, `.gitignore`, `.eslintrc.json`, `.prettierrc`, `docker-compose.yml` (skeleton)
  - Pre-commit: `bun test`

- [x] 2. Discord Bot Core + Slash Command Handler

  **What to do**:
  - Create `src/index.ts` — bot entry point, creates discord.js Client with intents: `Guilds`, `GuildMessages`, `GuildMembers`, `MessageContent`
  - Create `src/handlers/commandHandler.ts` — loads and registers slash commands from `src/commands/` directory
  - Create `src/handlers/eventHandler.ts` — loads and registers event handlers from `src/events/` directory
  - Create `src/events/interactionCreate.ts` — routes slash commands to their `execute()` function, with error handling
  - Create `src/events/ready.ts` — logs bot ready, registers slash commands to Discord API
  - Create `src/commands/ping.ts` — simple ping/pong command as proof of life
  - Create `src/types/command.ts` — Command interface/type with `data` (SlashCommandBuilder) and `execute` (interaction handler)
  - Create command deployment script `src/deploy-commands.ts` for registering commands with Discord API
  - Write TDD tests for command handler (loads commands, routes interaction, handles unknown command)

  **Must NOT do**:
  - Do NOT implement any RPG-specific commands yet (character, campaign, etc.)
  - Do NOT add message content intent unless absolutely needed
  - Do NOT set up sharding (not needed for personal project)
  - Do NOT use prefix commands — slash-only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-documented discord.js pattern, mechanical setup
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T3, T4, T5, T6 — no cross-dependencies)
  - **Parallel Group**: Wave 1
  - **Blocks**: T19, T20, T21
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - discord.js v14 command handling: `https://discordjs.guide/creating-your-bot/command-handling/`
  - Slash command registration: `https://discordjs.guide/creating-your-bot/registering-slash-commands.html`
  - Interaction create event: `https://discordjs.guide/creating-your-bot/event-handling/`

  **API/Type References**:
  - `discord.js` `Client` — requires `intents` array in constructor
  - `discord.js` `SlashCommandBuilder` — `.setName()`, `.setDescription()`, `.addStringOption()`, etc.
  - `discord.js` `ChatInputCommandInteraction` — `.reply()`, `.deferReply()`, `.editReply()`

  **External References**:
  - discord.js guide: `https://discordjs.guide/`

  **WHY Each Reference Matters**:
  - Command handling guide establishes canonical file-per-command pattern
  - Slash command registration uses REST API — must deploy separately from bot start
  - `deferReply()` pattern is MANDATORY for any LLM-invoking command (3-second Discord timeout)

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/handlers/commandHandler.test.ts`
  - [ ] `bun test tests/handlers/commandHandler.test.ts` → PASS (loads commands, routes, handles errors)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Discord bot starts and registers slash commands
    Tool: Bash
    Preconditions: Project scaffolded, DISCORD_TOKEN set in .env
    Steps:
      1. Run `bun run deploy-commands` to register commands with Discord
      2. Assert exit code 0, no error output
      3. Run `bun run start` to start the bot
      4. Assert console output contains "Bot logged in as" within 10 seconds
      5. Send `/ping` command in test Discord channel
      6. Assert bot responds with "Pong!" embed
    Expected Result: Bot starts, registers commands, responds to /ping
    Failure Indicators: Deploy script fails, bot crashes on start, /ping no response
    Evidence: .sisyphus/evidence/task-2-bot-start.txt

  Scenario: Command handler gracefully handles unknown commands
    Tool: Bun test
    Preconditions: Bot code compiled
    Steps:
      1. Run `bun test tests/handlers/commandHandler.test.ts`
      2. Assert test for "unknown command returns error embed" passes
    Expected Result: Unknown command interaction gets error response, not crash
    Failure Indicators: Handler throws unhandled exception for unknown command
    Evidence: .sisyphus/evidence/task-2-unknown-command.txt
  ```

  **Evidence to Capture**:
  - [ ] task-2-bot-start.txt
  - [ ] task-2-unknown-command.txt

  **Commit**: YES (group with T2)
  - Message: `feat(bot): add Discord bot core and slash command handler`
  - Files: `src/index.ts`, `src/handlers/`, `src/events/`, `src/commands/ping.ts`, `src/types/command.ts`, `src/deploy-commands.ts`, `tests/handlers/`
  - Pre-commit: `bun test`

- [x] 3. Shared Types + Zod Schemas

  **What to do**:
  - Create `src/types/character.ts` — Zod schemas for character data
    - `CharacterSchema`: id, name, class, level, hp, maxHp, stats (str/dex/con/int/wis/cha), inventory, backstory, campaignId, userId, rpgSystem (dnd5e | custom), createdAt, updatedAt
    - `DnD5eStatsSchema`: str, dex, con, int, wis, cha (each 1-30), ac, speed, hitDice
    - `CustomSimpleStatsSchema`: hp, attack, defense, speed, special (array of named abilities)
  - Create `src/types/campaign.ts` — Zod schemas for campaign data
    - `CampaignSchema`: id, name, description, rpgSystem, mode (sharedSession | persistentWorld | async), dmUserId, guildId, channelId, worldState, createdAt, updatedAt
    - `WorldStateSchema`: currentLocation, npcs, quests, events, sessionCount
  - Create `src/types/story.ts` — Zod schemas for story/session data
    - `StorySchema`: id, campaignId, scenes (array), currentSceneIndex, summary
    - `SceneSchema`: id, description, npcInteractions, playerActions, outcome, timestamp
  - Create `src/types/llm.ts` — Zod schemas for LLM interaction
    - `ChatMessageSchema`: role, content, timestamp, metadata
    - `ContextWindowSchema`: system, worldState, recentMessages, ragResults, totalTokens
  - Create `src/types/mcp.ts` — Zod schemas for MCP tool/resource inputs/outputs
  - Export inferred types from all schemas using `z.infer<>`
  - Write TDD tests for all schemas (validation success, validation failure for invalid data)

  **Must NOT do**:
  - Do NOT add database-specific types (Prisma types come in T4)
  - Do NOT add UI/rendering types (that's T16)
  - Do NOT over-engineer — keep schemas flat and simple, no premature abstraction
  - Do NOT add fields you don't need yet (YAGNI)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema definitions are well-defined, mechanical work
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T4, T5, T6)
  - **Parallel Group**: Wave 1
  - **Blocks**: T8, T9, T10, T11
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - Zod schema patterns: `https://zod.dev/` — `z.object()`, `z.string()`, `z.number()`, `z.enum()`, `z.infer<>`
  - D&D 5e stat blocks: `https://www.dnd5eapi.co/` — ability scores range 1-30, AC calculation

  **API/Type References**:
  - `@modelcontextprotocol/sdk` — MCP tool inputSchema expects Zod schemas
  - LangChain.js `HumanMessage`, `AIMessage` — role-based chat message types

  **External References**:
  - MCP specification tools: `https://modelcontextprotocol.io/docs/concepts/tools`

  **WHY Each Reference Matters**:
  - Zod schemas will be reused across MCP tools, LangChain, and Prisma — must be correct from the start
  - D&D 5e stat ranges must match official rules (1-30 for abilities)
  - MCP tool inputSchema directly uses Zod, so schema design affects MCP integration

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/types/schemas.test.ts`
  - [ ] `bun test tests/types/schemas.test.ts` → PASS (all schemas validate correct data, reject invalid data)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Character schemas validate correctly
    Tool: Bash
    Preconditions: Project scaffolded, Zod installed
    Steps:
      1. Run `bun test tests/types/schemas.test.ts`
      2. Assert: valid D&D 5e character (str: 16, dex: 14, etc.) passes validation
      3. Assert: valid Custom Simple character (hp: 100, attack: 15, etc.) passes validation
      4. Assert: str: 50 (out of range) fails validation
      5. Assert: missing required field fails validation
    Expected Result: All schema tests pass with correct validation behavior
    Failure Indicators: Out-of-range values accepted, required fields not enforced
    Evidence: .sisyphus/evidence/task-3-schema-validation.txt

  Scenario: Campaign mode enum validates only valid modes
    Tool: Bash
    Preconditions: Schema tests written
    Steps:
      1. Run `bun test tests/types/schemas.test.ts`
      2. Assert: mode "sharedSession" passes
      3. Assert: mode "persistentWorld" passes
      4. Assert: mode "async" passes
      5. Assert: mode "realtime" fails (invalid enum value)
    Expected Result: Only the 3 defined modes pass validation
    Failure Indicators: Invalid enum values accepted
    Evidence: .sisyphus/evidence/task-3-enum-validation.txt
  ```

  **Evidence to Capture**:
  - [ ] task-3-schema-validation.txt
  - [ ] task-3-enum-validation.txt

  **Commit**: YES (group with T3)
  - Message: `feat(types): add shared Zod schemas and TypeScript types`
  - Files: `src/types/*.ts`, `tests/types/schemas.test.ts`
  - Pre-commit: `bun test`

- [x] 4. Database Schema + Prisma Setup

  **What to do**:
  - Initialize Prisma: `npx prisma init --datasource-provider postgresql`
  - Configure `DATABASE_URL` in `.env` for PostgreSQL connection
  - Create Prisma schema with these models:
    - `User` — id, discordId (unique), username, createdAt, updatedAt
    - `Character` — id, userId, name, class, level, hp, maxHp, rpgSystem (enum: dnd5e, custom), stats (Json — flexible for both systems), inventory (Json), backstory, campaignId (optional), createdAt, updatedAt
    - `Campaign` — id, name, description, rpgSystem (enum), mode (enum: sharedSession, persistentWorld, async), dmUserId, guildId, channelId, worldState (Json), isActive, createdAt, updatedAt
    - `Story` — id, campaignId, scenes (Json — array of Scene objects), currentSceneIndex, summary, createdAt, updatedAt
    - `Message` — id, campaignId, userId, role (enum: system, user, assistant), content, tokenCount, metadata (Json), createdAt
    - `Embedding` — id, messageId, embedding (Unsupported("vector") for pgvector), content (text — the original content that was embedded)
  - Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;` in migration
  - Create seed script `prisma/seed.ts` with sample data for development
  - Run `npx prisma migrate dev --name init`
  - Write TDD tests for basic Prisma CRUD operations

  **Must NOT do**:
  - Do NOT use MongoDB or SQLite — PostgreSQL with pgvector only
  - Do NOT add indexes yet (optimization later)
  - Do NOT over-normalize — Json fields for flexible data (stats, inventory, worldState) is intentional
  - Do NOT create complex relations that aren't needed yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Prisma schema definition is well-documented, mechanical work
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T3, T5, T6)
  - **Parallel Group**: Wave 1
  - **Blocks**: T7, T11
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - Prisma PostgreSQL setup: `https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/postgresql`
  - pgvector with Prisma: `https://www.prisma.io/docs/concepts/components/prisma-schema/postgresql-preview-support#the-vector-type-preview` — uses `Unsupported("vector")` type

  **API/Type References**:
  - Prisma schema syntax: `model`, `@@relation`, `@@index`, `enum`, `Json`, `Unsupported`
  - pgvector dimensions: 1536 for OpenAI embeddings, or 768 for local models

  **External References**:
  - pgvector extension: `https://github.com/pgvector/pgvector`

  **WHY Each Reference Matters**:
  - pgvector requires `Unsupported("vector")` type in Prisma since it's not natively supported — this is a critical schema pattern
  - Json fields for stats/inventory allow flexible RPG data without schema migration per system change
  - Embedding table with `Unsupported("vector")` enables semantic search for context compression (RAG)

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/db/prisma.test.ts`
  - [ ] `bun test tests/db/prisma.test.ts` → PASS (CRUD operations work, pgvector insert works)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Prisma schema migrates successfully
    Tool: Bash
    Preconditions: Docker Compose running with PostgreSQL
    Steps:
      1. Run `docker compose up -d postgres`
      2. Run `npx prisma migrate dev --name init`
      3. Assert exit code 0, no migration errors
      4. Run `npx prisma studio` (or `npx prisma db pull`) to verify tables exist
      5. Assert tables: User, Character, Campaign, Story, Message, Embedding all present
    Expected Result: All tables created with correct columns and relations
    Failure Indicators: Migration fails, tables missing, column type mismatches
    Evidence: .sisyphus/evidence/task-4-migration.txt

  Scenario: CRUD operations work for all models
    Tool: Bash
    Preconditions: Migration complete, test DB available
    Steps:
      1. Run `bun test tests/db/prisma.test.ts`
      2. Assert: Create User → read User → matches
      3. Assert: Create Character with DnD5e stats → read → stats accessible as Json
      4. Assert: Create Campaign → read → worldState accessible as Json
      5. Assert: Create Story → read → scenes accessible as Json
      6. Assert: pgvector insert + similarity search works
    Expected Result: All CRUD operations pass, Json fields parse correctly, pgvector works
    Failure Indicators: Json fields not queryable, pgvector operations fail
    Evidence: .sisyphus/evidence/task-4-crud.txt
  ```

  **Evidence to Capture**:
  - [ ] task-4-migration.txt
  - [ ] task-4-crud.txt

  **Commit**: YES (group with T4)
  - Message: `feat(db): setup PostgreSQL schema and Prisma ORM`
  - Files: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/`, `tests/db/`
  - Pre-commit: `bun test`

- [x] 5. Embed Utilities + EmbedPaginator

  **What to do**:
  - Create `src/embeds/builder.ts` — utility functions for building consistent game embeds:
    - `createBaseEmbed()` — returns EmbedBuilder with default color, footer, timestamp
    - `addFieldSafe(embed, name, value, inline?)` — adds field, truncates value to 1024 chars with "..." ellipsis
    - `setThumbnailSafe(embed, url)` — sets thumbnail, handles missing URL gracefully
  - Create `src/embeds/paginator.ts` — EmbedPaginator class (Avrae-inspired pattern):
    - `addField(name, value, inline?)` — adds field to current embed, auto-splits if value > 1024 chars
    - `addDescription(text)` — adds description text, auto-splits across embeds if > 4096 chars
    - `setHeader(title, url?)` — sets title (max 256 chars)
    - `setFooter(text)` — footer only on last embed
    - `build()` — returns `EmbedBuilder[]`, each embed stays within Discord limits (6000 chars total, 25 fields max)
    - Internal chunking: splits long text at paragraph/sentence boundaries, uses `** **` as continuation header
  - Create `src/embeds/themes.ts` — color constants for embed themes:
    - `Colors.SUCCESS` (green), `Colors.DANGER` (red), `Colors.INFO` (blue), `Colors.WARNING` (yellow), `Colors.STORY` (purple), `Colors.RPG` (gold)
  - Create `src/embeds/components.ts` — reusable Discord UI components (buttons, select menus):
    - `createPaginationButtons(page, totalPages)` — back/forward buttons
    - `createConfirmButtons(customId)` — confirm/cancel
    - `createStatSelectMenu(customId, options)` — select menu for stats
  - Write TDD tests for EmbedPaginator edge cases:
    - Empty paginator returns empty array
    - Single embed stays within limits
    - 100+ fields auto-split across multiple embeds
    - 10,000 char description auto-splits
    - Footer only on last embed

  **Must NOT do**:
  - Do NOT implement game-specific embed renderers yet (that's T16)
  - Do NOT use Components V2 yet (legacy components are safer, migrate later)
  - Do NOT add ephemeral logic here — that's per-command decisions
  - Do NOT use `content` field alongside embeds (Components V2 restriction)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-defined DOM/Embed API, clear limits, mechanical utility code
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T3, T4, T6)
  - **Parallel Group**: Wave 1
  - **Blocks**: T16
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - discord.js EmbedBuilder API: `https://discord.js.org/docs/packages/builders/1.10.0/EmbedBuilder:Class`
  - Avrae EmbedPaginator pattern: splits content > 6000 chars across multiple embeds, defers footer to final embed, uses `** **` continuation headers
  - Discord embed limits: title 256, description 4096, fields 25, field value 1024, footer 2048, total 6000

  **API/Type References**:
  - `discord.js` `EmbedBuilder` — `.setTitle()`, `.setDescription()`, `.addFields()`, `.setFooter()`, `.setColor()`, `.setThumbnail()`
  - `discord.js` `ActionRowBuilder`, `ButtonBuilder`, `StringSelectMenuBuilder`

  **External References**:
  - Avrae bot source (EmbedPaginator reference): `https://github.com/avrae/avrae`

  **WHY Each Reference Matters**:
  - Avrae's EmbedPaginator is THE proven pattern for Discord RPG embeds — must replicate the chunking logic
  - Discord limits are hard limits — exceeding them causes API errors that crash the bot
  - Footer-only-on-last-embed pattern ensures consistent branding

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/embeds/paginator.test.ts`
  - [ ] `bun test tests/embeds/paginator.test.ts` → PASS (all edge cases: empty, single, overflow, splitting)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: EmbedPaginator correctly splits long content
    Tool: Bun test
    Preconditions: EmbedPaginator implemented
    Steps:
      1. Run `bun test tests/embeds/paginator.test.ts`
      2. Assert: empty paginator → empty array
      3. Assert: single field under limits → returns 1 embed
      4. Assert: 30 fields → returns 2 embeds (25 + 5)
      5. Assert: 10000 char description → splits across multiple embeds
      6. Assert: footer appears ONLY on last embed
      7. Assert: each embed ≤ 6000 total chars
      8. Assert: no single field value > 1024 chars
    Expected Result: All splitting tests pass, all embeds within Discord limits
    Failure Indicators: Embed exceeding limits, footer on non-final embed, field values truncated incorrectly
    Evidence: .sisyphus/evidence/task-5-paginator.txt

  Scenario: Field value truncation with ellipsis
    Tool: Bun test
    Preconditions: addFieldSafe implemented
    Steps:
      1. Assert: 500-char value → passes through unchanged
      2. Assert: 1025-char value → truncated to 1021 chars + "..."
      3. Assert: value with newlines → truncates at sentence boundary when possible
    Expected Result: Long values truncated gracefully, short values preserved
    Failure Indicators: Values over 1024 chars pass through unmodified
    Evidence: .sisyphus/evidence/task-5-truncation.txt
  ```

  **Evidence to Capture**:
  - [ ] task-5-paginator.txt
  - [ ] task-5-truncation.txt

  **Commit**: YES (group with T5)
  - Message: `feat(ui): add EmbedBuilder utilities and EmbedPaginator`
  - Files: `src/embeds/`, `tests/embeds/`
  - Pre-commit: `bun test`

- [x] 6. MCP Server Scaffold

  **What to do**:
  - Create `src/mcp/server.ts` — initialize MCP server with `McpServer` from `@modelcontextprotocol/sdk`
  - Create `src/mcp/transport.ts` — configure StdioServerTransport for internal process communication
  - Create `src/mcp/types.ts` — MCP-specific Zod schemas for tool inputs and resource URIs:
    - `CampaignListSchema`, `CharacterGetSchema`, `StoryAdvanceSchema`, `DiceRollSchema`
    - Resource URI patterns: `dungeon://campaigns/{id}`, `dungeon://characters/{id}`, `dungeon://stories/{id}`
  - Create `src/mcp/index.ts` — exports `startMcpServer()` function, wires transport to server
  - Create placeholder tool registration: `dungeon_ping` tool that returns `{ content: [{ type: "text", text: "pong" }] }`
  - Create placeholder resource registration: `dungeon://status` resource that returns bot status
  - Write TDD tests for MCP server (tool call → response, resource read → data)

  **Must NOT do**:
  - Do NOT implement full tool/resource logic yet (T11)
  - Do NOT expose MCP server to network — stdio transport only (internal)
  - Do NOT add HTTP transport (internal only)
  - Do NOT implement authentication (bot-internal only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-documented MCP SDK API, mechanical scaffold
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T3, T4, T5)
  - **Parallel Group**: Wave 1
  - **Blocks**: T11
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - MCP TypeScript SDK server creation: `https://modelcontextprotocol.io/docs/develop/build-server.md`
  - `McpServer` class — `server.registerTool()`, `server.registerResource()` methods
  - `StdioServerTransport` — for process-internal communication

  **API/Type References**:
  - `@modelcontextprotocol/sdk` — `McpServer`, `StdioServerTransport`
  - Zod `z` — for inputSchema definitions in tools

  **External References**:
  - MCP specification: `https://modelcontextprotocol.io/specification/latest`
  - Microsoft MCP for beginners: `https://github.com/microsoft/mcp-for-beginners`

  **WHY Each Reference Matters**:
  - MCP SDK API is specific — `registerTool(name, {description, inputSchema}, handler)` pattern must be followed exactly
  - Stdio transport for internal use means JSON-RPC over stdin/stdout — no HTTP server needed
  - Placeholder tool/resource validates the scaffold works before building real tools on top

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/mcp/server.test.ts`
  - [ ] `bun test tests/mcp/server.test.ts` → PASS (ping tool returns "pong", status resource returns data)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: MCP server starts and responds to tool calls
    Tool: Bun test
    Preconditions: MCP server scaffolded
    Steps:
      1. Run `bun test tests/mcp/server.test.ts`
      2. Assert: calling `dungeon_ping` tool returns `{ content: [{ type: "text", text: "pong" }] }`
      3. Assert: calling `dungeon://status` resource returns JSON with `status: "ok"`
    Expected Result: MCP server responds to ping tool and status resource
    Failure Indicators: Server fails to start, tool call returns error, resource not found
    Evidence: .sisyphus/evidence/task-6-mcp-scaffold.txt

  Scenario: MCP server uses stdio transport correctly
    Tool: Bun test
    Preconditions: Transport configured
    Steps:
      1. Assert: server connects via StdioServerTransport without error
      2. Assert: JSON-RPC messages can be sent and received
    Expected Result: Stdio transport works for internal communication
    Failure Indicators: Transport connection fails, JSON-RPC errors
    Evidence: .sisyphus/evidence/task-6-mcp-transport.txt
  ```

  **Evidence to Capture**:
  - [ ] task-6-mcp-scaffold.txt
  - [ ] task-6-mcp-transport.txt

  **Commit**: YES (group with T6)
  - Message: `feat(mcp): scaffold MCP server with stdio transport`
  - Files: `src/mcp/`, `tests/mcp/`
  - Pre-commit: `bun test`

- Pre-commit: `bun test`

- [x] 7. Database Repositories (Character, Campaign, Story)

  **What to do**:
  - Create `src/db/prisma.ts` — singleton Prisma client instance
  - Create `src/db/repositories/base.ts` — BaseRepository class with generic CRUD (findById, create, update, delete, list)
  - Create `src/db/repositories/character.ts` — CharacterRepository extending BaseRepository:
    - `findByUserId(userId)` — get all characters for a user
    - `findByCampaignId(campaignId)` — get all characters in a campaign
    - `updateStats(id, stats)` — update character stats (Json field)
    - `updateInventory(id, inventory)` — update inventory (Json field)
    - `updateHp(id, hp, maxHp?)` — update current/max HP
    - `levelUp(id, newLevel, statChanges)` — increment level with stat changes
  - Create `src/db/repositories/campaign.ts` — CampaignRepository:
    - `findByGuildId(guildId)` — get campaigns for a Discord server
    - `findActiveByChannelId(channelId)` — get active campaign in a channel
    - `updateWorldState(id, worldState)` — update world state (Json field)
    - `setActive(id, isActive)` — toggle campaign active status
    - `addPlayer(id, userId)` — add player to campaign
    - `removePlayer(id, userId)` — remove player from campaign
  - Create `src/db/repositories/story.ts` — StoryRepository:
    - `findByCampaignId(campaignId)` — get story for a campaign
    - `addScene(campaignId, scene)` — append scene to story
    - `updateSummary(campaignId, summary)` — update story summary
    - `getCurrentScene(campaignId)` — get current scene
  - Create `src/db/repositories/message.ts` — MessageRepository:
    - `findByCampaignId(campaignId, limit?, offset?)` — get messages for context
    - `createMessage(campaignId, userId, role, content, tokenCount)` — store message
    - `deleteOldMessages(campaignId, beforeDate)` — prune old messages
  - Create `src/db/repositories/embedding.ts` — EmbeddingRepository:
    - `createEmbedding(messageId, content, embedding)` — store embedding
    - `searchSimilar(embedding, limit, threshold)` — pgvector similarity search
    - `deleteByMessageIds(ids)` — cleanup embeddings
  - Write TDD tests for each repository using in-memory SQLite or testcontainers

  **Must NOT do**:
  - Do NOT add business logic to repositories — they are data access only
  - Do NOT implement caching yet (that's an optimization)
  - Do NOT add complex joins or aggregations beyond what's needed
  - Do NOT skip the embedding repository (pgvector search is critical for context compression)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple files, Prisma patterns, pgvector query — non-trivial but well-structured
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T4 schema)
  - **Parallel Group**: Wave 2 (after Wave 1)
  - **Blocks**: T8, T13
  - **Blocked By**: T4

  **References**:

  **Pattern References**:
  - Prisma repository pattern: `https://www.prisma.io/docs/concepts/components/prisma-client/crud` — findMany, create, update, delete
  - pgvector queries with Prisma: raw SQL `$queryRaw` for similarity search since Prisma doesn't natively support vector operations

  **API/Type References**:
  - `src/types/character.ts` — CharacterSchema, DnD5eStatsSchema, CustomSimpleStatsSchema
  - `src/types/campaign.ts` — CampaignSchema, WorldStateSchema
  - `src/types/story.ts` — StorySchema, SceneSchema
  - `prisma/schema.prisma` — Character, Campaign, Story, Message, Embedding models

  **External References**:
  - pgvector similarity search: `https://github.com/pgvector/pgvector#querying` — `<=>` operator for cosine distance, `<->` for L2 distance

  **WHY Each Reference Matters**:
  - Repository pattern must be clean data-access only — business logic goes in services
  - pgvector requires raw SQL queries since Prisma doesn't support vector operations natively — `$queryRaw` is the way
  - BaseRepository pattern avoids duplicating CRUD for each model

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test files created: `tests/db/repositories/*.test.ts`
  - [ ] `bun test tests/db/` → PASS (all CRUD operations, pgvector search)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Character repository CRUD operations work
    Tool: Bun test
    Preconditions: Database migrated, test container running
    Steps:
      1. Create a character with D&D 5e stats
      2. Read it back — assert stats object matches
      3. Update HP from 100 to 80
      4. Read again — assert hp=80, maxHp=100
      5. Level up from 1 to 2 with stat changes
      6. Read again — assert level=2
      7. Delete character
      8. Read again — assert null
    Expected Result: All CRUD operations pass, Json fields stored and retrieved correctly
    Failure Indicators: Json fields not parsed, update operations fail
    Evidence: .sisyphus/evidence/task-7-character-crud.txt

  Scenario: Embedding pgvector similarity search works
    Tool: Bun test
    Preconditions: pgvector extension enabled, test container running
    Steps:
      1. Insert 5 messages with embeddings
      2. Search for similar embeddings — assert top 3 results returned
      3. Assert results are ordered by similarity score
    Expected Result: pgvector search returns most similar embeddings, ordered by distance
    Failure Indicators: Search returns empty results, wrong order, or SQL errors
    Evidence: .sisyphus/evidence/task-7-pgvector-search.txt
  ```

  **Evidence to Capture**:
  - [ ] task-7-character-crud.txt
  - [ ] task-7-pgvector-search.txt

  **Commit**: YES (group with T7)
  - Message: `feat(db): add character, campaign, story repositories`
  - Files: `src/db/`, `tests/db/repositories/`
  - Pre-commit: `bun test`

- [x] 8. Character Service (Create, Stats, Inventory)

  **What to do**:
  - Create `src/services/character.ts` — CharacterService class:
    - `createCharacter(userId, data)` — validates via CharacterSchema, creates character, returns Character
    - `getCharacter(id)` — returns character or throws NotFoundError
    - `listCharacters(userId)` — returns all characters for user
    - `updateStats(id, stats)` — validates stats against RPG system schema (DnD5e or Custom), updates
    - `updateInventory(id, items)` — validates inventory structure, updates
    - `modifyHp(id, delta)` — add/subtract HP, enforce 0 ≤ hp ≤ maxHp
    - `levelUp(id)` — increment level, apply stat increases per RPG system rules
    - `addExperience(id, amount)` — track XP, auto-level when threshold met
    - `deleteCharacter(id)` — soft delete (set inactive) or hard delete
  - Create `src/services/character/stats/dnd5e.ts` — D&D 5e stat calculator:
    - `calculateModifier(score)` — `(score - 10) // 2`
    - `calculateAc(equipment, dexModifier)` — AC with dex bonus
    - `calculateHitPoints(level, conModifier, hitDie)` — HP by level
    - `validateStats(stats)` — ensure all ability scores 1-30
  - Create `src/services/character/stats/custom.ts` — Custom Simple stat calculator:
    - `validateStats(stats)` — ensure hp > 0, attack/defense reasonable ranges
    - `applyLevelUp(stats)` — simple stat increase scheme
  - Write TDD tests: character creation in both systems, stat validation, HP modification, level up

  **Must NOT do**:
  - Do NOT implement character rendering (that's T16)
  - Do NOT implement multiplayer logic (that's T18)
  - Do NOT add combat resolution logic (that's T21)
  - Do NOT over-validate beyond schema constraints

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Dual RPG stat systems, leveling logic, multiple validation paths — complex business logic
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T3 types + T7 repositories)
  - **Parallel Group**: Wave 2
  - **Blocks**: T19
  - **Blocked By**: T3, T7

  **References**:

  **Pattern References**:
  - `src/types/character.ts` — CharacterSchema, DnD5eStatsSchema, CustomSimpleStatsSchema (shape of data)
  - `src/db/repositories/character.ts` — CharacterRepository methods (data access layer)

  **API/Type References**:
  - `src/types/character.ts` — `Character`, `DnD5eStats`, `CustomSimpleStats` (z.infer types)
  - D&D 5e ability modifier: `(score - 10) / 2` (rounded down)
  - D&D 5e HP: hit die + con modifier per level

  **External References**:
  - D&D 5e SRD (Systems Reference Document): `https://dnd.wizards.com/what-is-dnd` — ability scores, AC, HP rules

  **WHY Each Reference Matters**:
  - Dual stat system is the core differentiator — both must work independently
  - D&D 5e modifiers and HP calculations must match official rules exactly
  - Character service is the foundation for all RPG operations — errors here cascade everywhere

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test files created: `tests/services/character.test.ts`, `tests/services/character/stats/dnd5e.test.ts`, `tests/services/character/stats/custom.test.ts`
  - [ ] `bun test tests/services/character/` → PASS (creation in both systems, stat validation, HP mod, level up)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Create character in both RPG systems
    Tool: Bun test
    Preconditions: Database available, repositories ready
    Steps:
      1. Create D&D 5e character: name "Aragorn", class "Fighter", rpgSystem "dnd5e"
      2. Assert: character.stats has str/dex/con/int/wis/cha fields
      3. Assert: stats validate (1-30 range)
      4. Create Custom Simple character: name "Quickfoot", class "Rogue", rpgSystem "custom"
      5. Assert: character.stats has hp/attack/defense/speed fields
      6. Assert: stats validate (positive values)
    Expected Result: Both character types created with correct stat shapes
    Failure Indicators: Wrong stat structure, validation errors on valid data
    Evidence: .sisyphus/evidence/task-8-create-chars.txt

  Scenario: HP modification respects bounds
    Tool: Bun test
    Preconditions: Character exists with hp=50, maxHp=100
    Steps:
      1. Add 30 HP → assert hp=80 (doesn't exceed maxHp)
      2. Add 30 HP again → assert hp=100 (capped at maxHp)
      3. Subtract 120 HP → assert hp=0 (doesn't go below 0)
      4. Add 25 HP → assert hp=25 (recovers from 0)
    Expected Result: HP always within [0, maxHp] bounds
    Failure Indicators: HP exceeds maxHp, HP goes negative
    Evidence: .sisyphus/evidence/task-8-hp-bounds.txt
  ```

  **Evidence to Capture**:
  - [ ] task-8-create-chars.txt
  - [ ] task-8-hp-bounds.txt

  **Commit**: YES (group with T8)
  - Message: `feat(character): implement character service with CRUD and stats`
  - Files: `src/services/character/`, `tests/services/character/`
  - Pre-commit: `bun test`

- [x] 9. RPG System Engine (D&D 5e + Custom Simple)

  **What to do**:
  - Create `src/services/rpg/engine.ts` — RPGEngine interface and factory:
    - `getEngine(rpgSystem)` — returns DnD5eEngine or CustomEngine based on campaign
    - Interface: `createDefaultStats()`, `validateStats(stats)`, `applyLevelUp(stats, level)`, `calculateDamageRoll(attack, defense)`, `calculateSkillCheck(stat, modifier, difficulty)`
  - Create `src/services/rpg/dnd5e.ts` — DnD5eEngine implementing RPGEngine:
    - `createDefaultStats()` — standard array (15, 14, 13, 12, 10, 8)
    - `validateStats(stats)` — all abilities 1-30, AC reasonable, speed reasonable
    - `applyLevelUp(stats, level)` — hit die + con mod HP increase, ASI at levels 4/8/12/16/19
    - `calculateDamageRoll(weapon, modifier, targetAc)` — attack roll (1d20 + modifier vs AC), damage roll
    - `calculateSkillCheck(ability, proficiency, difficulty)` — 1d20 + ability mod + proficiency (if proficient)
    - `calculateSavingThrow(ability, proficiency, dc)` — 1d20 + ability mod + proficiency
    - Dice notation parser for D&D expressions (e.g., "2d6+3", "1d20+5")
  - Create `src/services/rpg/custom.ts` — CustomEngine implementing RPGEngine:
    - `createDefaultStats()` — default hp: 100, attack: 10, defense: 10, speed: 5
    - `validateStats(stats)` — positive numbers, reasonable ranges
    - `applyLevelUp(stats, level)` — simple +hp, +attack or +defense choice
    - `calculateDamageRoll(attack, defense)` — attack vs defense with random factor
    - `calculateSkillCheck(stat, difficulty)` — simple success/fail based on stat vs difficulty
  - Create `src/services/rpg/dice.ts` — DiceRoller utility:
    - `roll(sides)` — single die
    - `rollMultiple(count, sides)` — multiple dice
    - `rollWithModifier(count, sides, modifier)` — dice + static modifier
    - `parseDiceNotation(notation)` — parse "2d6+3" → { count: 2, sides: 6, modifier: 3 }
    - `rollFromNotation(notation)` — parse and roll
  - Write TDD tests for both engines and dice roller

  **Must NOT do**:
  - Do NOT implement full D&D 5e spell system (too complex for MVP)
  - Do NOT implement combat initiative tracking yet (that's T21)
  - Do NOT implement Custom Simple system as just "simplified D&D" — make it genuinely different
  - Do NOT implement character rendering (that's T16)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Two complete RPG stat engines, dice notation parser, mathematical accuracy critical
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T3 types)
  - **Parallel Group**: Wave 2
  - **Blocks**: T19, T21
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `src/types/character.ts` — DnD5eStatsSchema, CustomSimpleStatsSchema

  **API/Type References**:
  - D&D 5e SRD: ability modifiers = `(score - 10) / 2` rounded down
  - D&D 5e SRD: proficiency bonus = `2 + ((level - 1) / 4)` rounded down
  - D&D 5e SRD: AC = 10 + dex modifier (base), modified by armor

  **External References**:
  - D&D 5e SRD: `https://dnd.wizards.com/what-is-dnd`
  - Dice notation standard: `XdY[+/-Z]` — X dice with Y sides, plus/minus modifier Z

  **WHY Each Reference Matters**:
  - RPG engines are the core game logic — calculations must be accurate to D&D 5e SRD
  - Dice notation parsing is used throughout the entire bot (combat, skills, saving throws)
  - Factory pattern allows clean switching between systems at campaign level

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test files created: `tests/services/rpg/dnd5e.test.ts`, `tests/services/rpg/custom.test.ts`, `tests/services/rpg/dice.test.ts`
  - [ ] `bun test tests/services/rpg/` → PASS (all engine calculations, dice parsing)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: D&D 5e stat calculations match SRD rules
    Tool: Bun test
    Preconditions: DnD5eEngine implemented
    Steps:
      1. Assert: calculateModifier(10) = 0
      2. Assert: calculateModifier(18) = 4
      3. Assert: calculateModifier(1) = -5
      4. Assert: calculateModifier(30) = 10
      5. Assert: proficiencyBonus(1) = 2, proficiencyBonus(5) = 3, proficiencyBonus(17) = 6
      6. Assert: attack roll vs AC 15 with +5 modifier — roll 11+5=16 hits, roll 9+5=14 misses
    Expected Result: All D&D 5e calculations match SRD
    Failure Indicators: Modifier calculations wrong, proficiency bonus off-by-one
    Evidence: .sisyphus/evidence/task-9-dnd5e-calcs.txt

  Scenario: Dice notation parser and roller work correctly
    Tool: Bun test
    Preconditions: DiceRoller implemented
    Steps:
      1. Assert: parseDiceNotation("2d6+3") = { count: 2, sides: 6, modifier: 3 }
      2. Assert: parseDiceNotation("1d20-2") = { count: 1, sides: 20, modifier: -2 }
      3. Assert: parseDiceNotation("3d8") = { count: 3, sides: 8, modifier: 0 }
      4. Assert: rollFromNotation("1d1") always returns 1
      5. Assert: rollFromNotation("2d6") returns value between 2 and 12
      6. Assert: invalid notation "abc" throws error
    Expected Result: Dice notation parsed and rolled correctly
    Failure Indicators: Parser crashes, out-of-range values, invalid notation accepted
    Evidence: .sisyphus/evidence/task-9-dice-notation.txt
  ```

  **Evidence to Capture**:
  - [ ] task-9-dnd5e-calcs.txt
  - [ ] task-9-dice-notation.txt

  **Commit**: YES (group with T9)
  - Message: `feat(rpg): implement dual RPG system engine`
  - Files: `src/services/rpg/`, `tests/services/rpg/`
  - Pre-commit: `bun test`

- [x] 10. Context Manager (Token Counting, Compression)

  **What to do**:
  - Create `src/services/context/tokenizer.ts` — Token counting utility:
    - `countTokens(text)` — estimate token count (4 chars ≈ 1 token heuristic, or tiktoken if feasible)
    - `truncateToTokens(text, maxTokens)` — truncate text to fit within token budget
  - Create `src/services/context/manager.ts` — ContextManager class:
    - `buildContext(campaignId)` — assemble full context window:
      1. System prompt (~2k tokens) — RPG rules, character info, world state
      2. World state summary (~4k tokens) — from campaign.worldState
      3. Recent messages (~10k tokens) — last N messages from MessageRepository
      4. RAG-retrieved relevant history (~12k tokens) — from EmbeddingRepository similarity search
      5. Leave 4k headroom for response
    - `compressIfNeeded(campaignId)` — check if context exceeds budget, compress via:
      - Summarize old messages → store summary in campaign.worldState
      - Drop oldest messages beyond recent window
      - Re-run RAG retrieval with tighter threshold
    - `addMessage(campaignId, role, content)` — store message + create embedding
  - Create `src/services/context/compressor.ts` — Context compressor:
    - `summarizeMessages(messages)` — LLM-powered summarization of old messages
    - `selectRelevantHistory(query, campaignId, limit)` — pgvector similarity search for relevant past context
    - `buildSystemPrompt(campaign, characters)` — assemble system prompt with RPG rules, character info
  - Create `src/services/context/budget.ts` — TokenBudget tracker:
    - `MAX_CONTEXT = 32000`
    - `SYSTEM_PROMPT_BUDGET = 2000`
    - `WORLD_STATE_BUDGET = 4000`
    - `RECENT_MESSAGES_BUDGET = 10000`
    - `RAG_BUDGET = 12000`
    - `RESPONSE_HEADROOM = 4000`
    - `allocate(breakdown)` — allocate token budget across sections, return remaining tokens
  - Write TDD tests: token counting, budget allocation, message storage, compression triggers

  **Must NOT do**:
  - Do NOT implement actual LLM calls here — summarize via LLM service later (T14)
  - Do NOT implement embedding creation here — that's in the LLM service (T14)
  - Do NOT use tiktoken npm package unless confirmed compatible with Bun (use heuristic first)
  - Do NOT exceed 28k tokens in assembled context (4k headroom for response)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core architecture for 32k context management, multiple compression strategies, token budget math
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T3 types)
  - **Parallel Group**: Wave 2
  - **Blocks**: T14
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - LangChain.js memory: `https://js.langchain.com/docs/concepts/memory/` — ConversationSummaryMemory, VectorStoreRetrieverMemory
  - LangChain.js chat models: `https://js.langchain.com/docs/concepts/chat_models/` — message format, token counting

  **API/Type References**:
  - `src/types/llm.ts` — ChatMessageSchema, ContextWindowSchema
  - `src/db/repositories/message.ts` — MessageRepository (store/retrieve messages)
  - `src/db/repositories/embedding.ts` — EmbeddingRepository (similarity search)

  **External References**:
  - Token estimation heuristic: ~4 characters per token for English text (reasonable approximation)
  - LangChain.js memory patterns: `https://js.langchain.com/docs/concepts/memory/`

  **WHY Each Reference Matters**:
  - Context compression is the core technical challenge of this bot
  - Budget allocation must be strict — 32k is a hard limit
  - LangChain memory patterns provide proven compression strategies

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test files created: `tests/services/context/*.test.ts`
  - [ ] `bun test tests/services/context/` → PASS (token counting, budget, message storage, compression logic)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Token budget allocation respects limits
    Tool: Bun test
    Preconditions: TokenBudget implemented
    Steps:
      1. Allocate full budget: system=2k, world=4k, recent=10k, rag=12k, headroom=4k
      2. Assert total = 32k
      3. Simulate system prompt of 2.5k tokens — assert world state gets less budget (3.5k)
      4. Simulate system prompt of 1k tokens — assert freed tokens go to RAG budget
      5. Assert: no section can exceed its budget
    Expected Result: Budget allocation dynamically adjusts while total never exceeds 32k
    Failure Indicators: Total exceeds 32k, sections exceed their caps, no reallocation
    Evidence: .sisyphus/evidence/task-10-budget.txt

  Scenario: Context compression triggers correctly
    Tool: Bun test
    Preconditions: ContextManager implemented with mock LLM
    Steps:
      1. Add 100 messages to a campaign
      2. Build context — assert recent messages (last 10-15) are kept verbatim
      3. Assert older messages are either summarized or dropped
      4. Assert total context tokens < 28k (4k headroom preserved)
    Expected Result: Context stays within budget even with many messages
    Failure Indicators: Context exceeds 28k, recent messages dropped, no summarization
    Evidence: .sisyphus/evidence/task-10-compression.txt
  ```

  **Evidence to Capture**:
  - [ ] task-10-budget.txt
  - [ ] task-10-compression.txt

  **Commit**: YES (group with T10)
  - Message: `feat(context): implement token counter and compression pipeline`
  - Files: `src/services/context/`, `tests/services/context/`
  - Pre-commit: `bun test`

- [x] 11. MCP Tools and Resources Registration

  **What to do**:
  - Register all MCP tools on the server scaffolded in T6:
    - `character_create` — create a new character (input: name, class, rpgSystem, backstory?)
    - `character_get` — get character details (input: id)
    - `character_list` — list characters for user/campaign (input: userId, campaignId?)
    - `character_update` — update character stats/inventory/HP (input: id, updates)
    - `campaign_create` — create a new campaign (input: name, rpgSystem, mode, description?)
    - `campaign_get` — get campaign details (input: id)
    - `campaign_list` — list campaigns for guild (input: guildId)
    - `campaign_update_world_state` — update world state (input: id, worldState)
    - `story_advance` — advance story with player action (input: campaignId, action)
    - `story_get` — get current story state (input: campaignId)
    - `dice_roll` — roll dice (input: notation, modifier?)
  - Register all MCP resources:
    - `dungeon://campaigns/{id}` — read-only campaign data
    - `dungeon://characters/{id}` — read-only character data
    - `dungeon://stories/{id}` — read-only story data
    - `dungeon://campaigns/{id}/world-state` — read-only world state
  - Each tool handler calls the corresponding service/repository methods
  - Add Zod input validation to all tool inputs
  - Write TDD tests for each tool (mock service dependencies)

  **Must NOT do**:
  - Do NOT implement service logic here — only wire tools to services
  - Do NOT add HTTP transport — stdio only
  - Do NOT expose MCP server externally — internal use only
  - Do NOT add authentication — bot-internal only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Many tools/resources to register, Zod schemas, but pattern is repetitive
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T3, T4, T6)
  - **Parallel Group**: Wave 2
  - **Blocks**: T13
  - **Blocked By**: T3, T4, T6

  **References**:

  **Pattern References**:
  - `src/mcp/server.ts` — McpServer and StdioServerTransport setup from T6
  - `src/types/mcp.ts` — Zod schemas for tool inputs from T6
  - MCP tool registration pattern: `server.registerTool(name, {description, inputSchema}, handler)`

  **API/Type References**:
  - `@modelcontextprotocol/sdk` — `McpServer.registerTool()`, `McpServer.registerResource()`
  - `src/services/character.ts` — CharacterService methods
  - `src/db/repositories/campaign.ts` — CampaignRepository methods
  - `src/db/repositories/story.ts` — StoryRepository methods

  **External References**:
  - MCP tool definition: `https://modelcontextprotocol.io/docs/concepts/tools`
  - MCP resource definition: `https://modelcontextprotocol.io/docs/concepts/resources`

  **WHY Each Reference Matters**:
  - MCP tools/resources are the internal API layer for story/campaign management
  - Zod validation ensures tool inputs are type-safe before reaching services
  - Tool handlers must be thin wrappers — all logic lives in services

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `tests/mcp/tools.test.ts`
  - [ ] `bun test tests/mcp/tools.test.ts` → PASS (all tools respond correctly, resources return data)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: MCP tools accept valid inputs and call services
    Tool: Bun test (mock services)
    Preconditions: MCP server with registered tools, mock service layer
    Steps:
      1. Call character_create with valid input → assert returns created character
      2. Call character_get with valid id → assert returns character data
      3. Call campaign_create with valid input → assert returns created campaign
      4. Call story_advance with valid input → assert returns advanced story
      5. Call dice_roll with "2d6+3" → assert returns numeric result
    Expected Result: All tools accept valid inputs, call correct service methods, return expected data
    Failure Indicators: Zod validation rejects valid input, service not called, wrong return format
    Evidence: .sisyphus/evidence/task-11-mcp-tools.txt

  Scenario: MCP tools reject invalid inputs
    Tool: Bun test
    Preconditions: MCP server with registered tools
    Steps:
      1. Call character_create with missing name → assert returns error
      2. Call dice_roll with "abc" → assert returns error
      3. Call campaign_get with non-existent id → assert returns not found
    Expected Result: All tools reject invalid inputs with clear error messages
    Failure Indicators: Invalid inputs accepted, crashes on bad data
    Evidence: .sisyphus/evidence/task-11-mcp-validation.txt
  ```

  **Evidence to Capture**:
  - [ ] task-11-mcp-tools.txt
  - [ ] task-11-mcp-validation.txt

  **Commit**: YES (group with T11)
  - Message: `feat(mcp): register MCP tools and resources for story/campaign`
  - Files: `src/mcp/`, `tests/mcp/`
  - Pre-commit: `bun test`

- [x] 12. LangChain.js Integration + Tools Setup

  **What to do**:
  - Install LangChain.js dependencies: `@langchain/core`, `langchain`, `@langchain/community`
  - Create `src/services/llm/client.ts` — LLM client factory:
    - `createLLM(config)` — creates ChatOpenAI instance with custom endpoint URL
    - Support both custom API and OpenRouter endpoints
    - Configure: `modelName`, `temperature`, `maxTokens`, `baseUrl`, `apiKey`
  - Create `src/services/llm/tools.ts` — LangChain tool definitions:
    - `createCharacterTool` — wraps character_create MCP tool for LangChain
    - `getCampaignTool` — wraps campaign_get for LangChain
    - `storyAdvanceTool` — wraps story_advance for LangChain
    - `diceRollTool` — wraps dice_roll for LangChain
    - `searchMemoryTool` — searches relevant past context via pgvector
  - Create `src/services/llm/memory.ts` — LangChain memory setup:
    - `ConversationSummaryMemory` — summarizes old messages
    - Token-limit aware — compresses when approaching budget
    - Integrates with ContextManager (T10) for persistent storage
  - Create `src/services/llm/chains.ts` — LangChain chains:
    - `createStoryChain(campaign, characters)` — main story generation chain
    - `createCharacterSheetChain()` — character sheet generation chain
    - `createSummaryChain(messages)` — message summarization chain
  - Write TDD tests with mocked LLM responses

  **Must NOT do**:
  - Do NOT hardcode LLM API keys — use environment variables
  - Do NOT implement actual LLM calling in tests — mock all external calls
  - Do NOT add streaming response handling yet (that's for T14)
  - Do NOT use LangChain agent — use chains + tools explicitly (more control)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: LangChain.js integration requires understanding of its API patterns, but is well-documented
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7, T8, T9, T10, T11 — only depends on T3 types)
  - **Parallel Group**: Wave 2
  - **Blocks**: T14
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - LangChain.js ChatOpenAI: `https://js.langchain.com/docs/integrations/chat/openai/` — custom baseUrl, modelName, temperature
  - LangChain.js Tools: `https://js.langchain.com/docs/concepts/tools/` — DynamicStructuredTool, tool()
  - LangChain.js Memory: `https://js.langchain.com/docs/concepts/memory/` — ConversationSummaryMemory, BufferMemory

  **API/Type References**:
  - `src/types/llm.ts` — ChatMessageSchema, ContextWindowSchema
  - `src/services/context/manager.ts` — ContextManager (buildContext, addMessage)
  - `@langchain/core/tools` — `DynamicStructuredTool`, `tool()` function
  - `langchain/chat_models/openai` — `ChatOpenAI` with custom `configuration.basePath`

  **External References**:
  - LangChain.js docs: `https://js.langchain.com/`
  - OpenAI-compatible endpoints: `https://platform.openai.com/docs/api-reference/chat`

  **WHY Each Reference Matters**:
  - LangChain.js ChatOpenAI supports custom baseUrl — this is how we connect to custom endpoint
  - Tools must be LangChain DynamicStructuredTool instances to be callable by LLM
  - ConversationSummaryMemory is the compression mechanism for LangChain — integrates with our ContextManager

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test files created: `tests/services/llm/*.test.ts`
  - [ ] `bun test tests/services/llm/` → PASS (client creation, tool definitions, chain setup, mock responses)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: LLM client creates with custom endpoint
    Tool: Bun test
    Preconditions: LangChain installed, config with custom endpoint
    Steps:
      1. Create LLM client with custom API URL and API key
      2. Assert: ChatOpenAI instance has correct baseUrl
      3. Assert: modelName matches config
      4. Assert: maxTokens set to 4000 (response headroom)
    Expected Result: LLM client configured for custom endpoint correctly
    Failure Indicators: Client uses default OpenAI URL, config not applied
    Evidence: .sisyphus/evidence/task-12-llm-client.txt

  Scenario: LangChain tools are callable and return data
    Tool: Bun test (mocked LLM)
    Preconditions: Tools defined, mock LLM responses
    Steps:
      1. Call diceRollTool with "2d6+3" → assert numeric result
      2. Call searchMemoryTool with query → assert returns relevant context
      3. Call createCharacterTool with valid input → assert returns character data
    Expected Result: All tools call correctly and return expected data shapes
    Failure Indicators: Tool calls fail, wrong return format, Zod validation errors
    Evidence: .sisyphus/evidence/task-12-langchain-tools.txt
  ```

  **Evidence to Capture**:
  - [ ] task-12-llm-client.txt
  - [ ] task-12-langchain-tools.txt

  **Commit**: YES (group with T12)
  - Message: `feat(llm): integrate LangChain.js with custom endpoint and memory`
  - Files: `src/services/llm/`, `tests/services/llm/`
  - Pre-commit: `bun test`

- [x] 13. Campaign and Story Engine Service

  **What to do**:
  - Create `src/services/campaign.ts` — CampaignService:
    - `createCampaign(dmUserId, data)` — create campaign with rpgSystem, mode, guildId, channelId
    - `getCampaign(id)` — get campaign details
    - `listCampaigns(guildId)` — list active campaigns in guild
    - `joinCampaign(id, userId)` — add player to campaign
    - `leaveCampaign(id, userId)` — remove player from campaign
    - `updateWorldState(id, updates)` — update world state (location, NPCs, quest progress)
    - `setMode(id, mode)` — switch between sharedSession/persistentWorld/async
    - `endCampaign(id)` — mark campaign as inactive
  - Create `src/services/story.ts` — StoryService:
    - `createStory(campaignId)` — initialize story for campaign
    - `getStory(campaignId)` — get current story state
    - `advanceScene(campaignId, action, outcome)` — add new scene to story
    - `getCurrentScene(campaignId)` — get current scene
    - `summarizeStory(campaignId)` — generate summary of story so far (calls LLM via ContextManager)
    - `rollbackScene(campaignId, sceneCount)` — DM rollback (undo N scenes)
  - Create `src/services/campaign/state.ts` — CampaignState manager:
    - In-memory Map cache for active campaigns (avoids DB hit per interaction)
    - `loadState(campaignId)` — load from PostgreSQL, cache in memory
    - `saveState(campaignId)` — persist cache to PostgreSQL
    - `invalidateState(campaignId)` — clear cache entry
    - `getActiveChannel(guildId)` — find which channel has active campaign
  - Write TDD tests: campaign CRUD, story advancement, world state updates, rollback

  **Must NOT do**:
  - Do NOT implement LLM narrative generation here (that's T14)
  - Do NOT implement multiplayer mode-specific logic (that's T18)
  - Do NOT implement embed rendering (that's T16)
  - Do NOT use Redis — in-memory Map is sufficient for personal project

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Campaign/story engine is core business logic with state management
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T7 repos + T11 MCP)
  - **Parallel Group**: Wave 3
  - **Blocks**: T20
  - **Blocked By**: T7, T11

  **References**:
  **Pattern References**:
  - `src/db/repositories/campaign.ts` — CampaignRepository (data access)
  - `src/db/repositories/story.ts` — StoryRepository (data access)
    **API/Type References**:
  - `src/types/campaign.ts` — CampaignSchema, WorldStateSchema
  - `src/types/story.ts` — StorySchema, SceneSchema

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/services/campaign* tests/services/story*` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Campaign lifecycle works end-to-end
    Tool: Bun test
    Steps:
      1. Create campaign with rpgSystem "dnd5e", mode "sharedSession"
      2. Assert: campaign has correct fields, isActive=true
      3. Join with userId "player1" → assert players includes "player1"
      4. Update world state → assert world state saved
      5. End campaign → assert isActive=false
    Expected Result: Full lifecycle works
    Evidence: .sisyphus/evidence/task-13-campaign-lifecycle.txt

  Scenario: Story advancement and rollback works
    Tool: Bun test
    Steps:
      1. Create story, advance 2 scenes
      2. Assert: currentSceneIndex=2
      3. Rollback 1 scene → assert currentSceneIndex=1
    Expected Result: Story advances and rolls back correctly
    Evidence: .sisyphus/evidence/task-13-story-advance.txt
  ```

  **Commit**: YES
  - Message: `feat(story): implement campaign and story engine service`
  - Files: `src/services/campaign.ts`, `src/services/story.ts`, `src/services/campaign/state.ts`, `tests/services/`

- [x] 14. LLM Orchestration Service

  **What to do**:
  - Create `src/services/llm/orchestrator.ts` — LLMOrchestrator class:
    - `generateStory(campaignId, playerAction, context)` — main story generation: build context → call LLM → store response → compress if needed → return
    - `generateCharacterSheet(characterId)` — format character as LLM-friendly text
    - `generateSummary(campaignId)` — summarize story so far (for context compression)
    - `handleStreamingResponse(campaignId, interaction)` — stream response to Discord
  - Create `src/services/llm/prompts.ts` — System prompt templates with {{variables}}
    - `DND5E_SYSTEM_PROMPT`, `CUSTOM_SYSTEM_PROMPT`, `STORY_SUMMARY_PROMPT`, `CHARACTER_SHEET_PROMPT`
  - Create `src/services/llm/response.ts` — Response parser:
    - `parseNarrativeResponse(raw)` — extract narrative text from LLM response
    - `parseDiceRolls(raw)` — extract dice roll requests (e.g., [roll:2d6+3])
    - `parseStateChanges(raw)` — extract world state changes (e.g., [state:hp-5])
  - Create OpenRouter integration: fallback logic — try custom API first, fall back to OpenRouter if configured
  - Write TDD tests with mocked LLM responses

  **Must NOT do**:
  - Do NOT make actual LLM API calls in tests — mock everything
  - Do NOT implement Discord response formatting here (that's T16)
  - Do NOT implement rate limiting here (that's T17)
  - Do NOT hardcode prompts — use templates with variables

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core LLM orchestration with context assembly, streaming, and response parsing
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T10 + T12)
  - **Parallel Group**: Wave 3
  - **Blocks**: T20, T21
  - **Blocked By**: T10, T12

  **References**:
  **Pattern References**:
  - `src/services/context/manager.ts` — ContextManager (buildContext, addMessage)
  - `src/services/llm/client.ts` — LLM client factory
  - `src/services/llm/chains.ts` — LangChain chains
    **API/Type References**:
  - `@langchain/core/messages` — HumanMessage, AIMessage, SystemMessage
  - `langchain/chat_models/openai` — ChatOpenAI with custom basePath

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/services/llm/orchestrator*` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: LLM orchestrator generates story with context
    Tool: Bun test (mocked LLM)
    Steps:
      1. Call generateStory with campaignId, action "I open the dungeon door"
      2. Assert: system prompt includes RPG rules
      3. Assert: context includes recent messages
      4. Assert: LLM called with full context
      5. Assert: response stored in MessageRepository
    Expected Result: Story generation assembles context, calls LLM, stores response
    Evidence: .sisyphus/evidence/task-14-orchestrator.txt

  Scenario: Response parser extracts structured data
    Tool: Bun test
    Steps:
      1. Parse "You swing! [roll:1d20+5] Goblin takes [state:hp-8] damage."
      2. Assert: narrative="You swing!", diceRolls=["1d20+5"], stateChanges=["hp-8"]
    Expected Result: Parser extracts narrative, dice rolls, state changes
    Evidence: .sisyphus/evidence/task-14-response-parser.txt
  ```

  **Commit**: YES
  - Message: `feat(llm): implement LLM orchestration with context management`
  - Files: `src/services/llm/orchestrator.ts`, `src/services/llm/prompts.ts`, `src/services/llm/response.ts`, `tests/services/llm/`

- [x] 15. Dice and Math Expression Engine

  **What to do**:
  - Create `src/services/rpg/dice-cli.ts` — Discord-friendly dice command handler:
    - Parse dice notation: "2d6+3", "1d20 advantage", "4d6kh3"
    - Support advantage/disadvantage, drop/keep, crit rules
  - Create `src/services/rpg/math-engine.ts` — Safe math expression evaluator:
    - `evaluate(expression)` — evaluate simple math (no eval/Function, injection-safe)
  - Create `src/utils/random.ts` — Seeded PRNG for reproducible test results
  - Write TDD tests for all dice notations, math expressions, injection prevention

  **Must NOT do**:
  - Do NOT use `eval()` or `Function()` — code injection vulnerability
  - Do NOT implement complex dice beyond D&D needs
  - Do NOT add RPG rule resolution (that's in T9 engines)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mathematical parsing, well-defined scope, extensive tests but straightforward
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T13, T14, T16, T17)
  - **Parallel Group**: Wave 3
  - **Blocks**: T21
  - **Blocked By**: T3

  **References**:
  **Pattern References**:
  - `src/services/rpg/dice.ts` — DiceRoller (basic rolls) from T9
    **API/Type References**:
  - `src/types/character.ts` — stat schemas for modifier calculation

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/services/rpg/dice-cli* tests/services/rpg/math*` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Dice notation with advantage/disadvantage
    Tool: Bun test
    Steps:
      1. Roll "1d20 advantage" → higher of 2 rolls
      2. Roll "1d20 disadvantage" → lower of 2 rolls
      3. Roll "4d6kh3" → sum of highest 3 of 4 dice
      4. Roll "2d6+3" → value between 5 and 15
    Expected Result: All dice notations work correctly
    Evidence: .sisyphus/evidence/task-15-dice-advantage.txt

  Scenario: Math engine evaluates safely, blocks injection
    Tool: Bun test
    Steps:
      1. "2+3*4" → 14
      2. "(10-5)/2" → 2.5
      3. "Math.pow(2,10)" → error (injection blocked)
      4. "process.exit()" → error (injection blocked)
    Expected Result: Correct math, injection blocked
    Evidence: .sisyphus/evidence/task-15-math-safety.txt
  ```

  **Commit**: YES
  - Message: `feat(dice): implement dice and math expression engine`
  - Files: `src/services/rpg/dice-cli.ts`, `src/services/rpg/math-engine.ts`, `src/utils/random.ts`, `tests/services/rpg/`

- [x] 16. Embed Renderer (Character Sheets, Campaign Status, Battle UI)

  **What to do**:
  - Create `src/embeds/renderers/character.ts` — Character embed renderer:
    - `renderCharacterSheet(character)` — full sheet with stats, inventory, backstory (uses EmbedPaginator)
    - `renderCharacterMini(character)` — compact inline summary for battle/chat
    - HP as visual progress bar: ██████░░░░ 60/100
    - D&D 5e format: abilities with modifiers, AC, speed, equipment
    - Custom Simple format: hp/attack/defense bars, special abilities
  - Create `src/embeds/renderers/campaign.ts` — Campaign embed renderer:
    - `renderCampaignStatus(campaign)` — overview with mode, system, world state
    - `renderWorldState(campaign)` — location, NPCs, quests (uses EmbedPaginator for large states)
    - `renderPlayerList(campaign)` — list of players with their characters
  - Create `src/embeds/renderers/story.ts` — Story embed renderer:
    - `renderScene(scene)` — current scene with NPC interactions
    - `renderStorySummary(story)` — summary of past events (uses EmbedPaginator)
    - `renderNarrativeResponse(response)` — format LLM response with Markdown formatting
  - Create `src/embeds/renderers/battle.ts` — Battle embed renderer:
    - `renderBattleState(participants)` — HP bars, initiative order, current turn
    - `renderAttackResult(attacker, defender, result)` — attack description, damage dealt
    - `renderDamageDice(results)` — dice roll results formatted
  - Create `src/embeds/renderers/dice.ts` — Dice roll result embed
  - ALL renderers MUST use EmbedPaginator for content exceeding 6000 chars / 25 fields

  **Must NOT do**:
  - Do NOT make embeds that exceed Discord limits — ALWAYS use EmbedPaginator
  - Do NOT include game logic in renderers — they consume data, not compute
  - Do NOT use Components V2 — legacy embeds for now
  - Do NOT hardcode Discord channel/user IDs

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Embed rendering requires visual design sense and good formatting
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T13, T14, T15, T17)
  - **Parallel Group**: Wave 3
  - **Blocks**: T19, T20
  - **Blocked By**: T5

  **References**:
  **Pattern References**:
  - `src/embeds/paginator.ts` — EmbedPaginator
  - `src/embeds/themes.ts` — Color constants
    **API/Type References**:
  - `discord.js` EmbedBuilder — .setTitle(), .addFields(), .setColor(), .setFooter()
  - `src/types/character.ts`, `src/types/campaign.ts`, `src/types/story.ts`
    **External References**:
  - Discord embed limits: title 256, description 4096, fields 25, field value 1024, total 6000

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/embeds/renderers/` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Character sheet renders correctly for both RPG systems
    Tool: Bun test
    Steps:
      1. Render D&D 5e character → assert embed has ability scores, modifiers, AC, HP bar
      2. Assert embed < 6000 chars, fields < 25
      3. Render Custom Simple character → assert hp/attack/defense bars, special abilities
    Expected Result: Both character sheets within Discord limits
    Evidence: .sisyphus/evidence/task-16-character-sheets.txt

  Scenario: Long world state auto-paginates
    Tool: Bun test
    Steps:
      1. Render campaign with 30+ NPCs and 10+ quests
      2. Assert: EmbedPaginator returns 2+ embeds
      3. Assert: each < 6000 chars, < 25 fields
      4. Assert: footer only on last embed
    Expected Result: Large content auto-paginates correctly
    Evidence: .sisyphus/evidence/task-16-paginator-world.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): implement game embed renderers`
  - Files: `src/embeds/renderers/`, `tests/embeds/renderers/`

- [x] 17. Command Queue + Rate Limiter

  **What to do**:
  - Create `src/services/queue.ts` — CommandQueue (per-user FIFO queue, sequential execution per user, concurrent across users)
  - Create `src/services/rate-limiter.ts` — RateLimiter (token bucket, per-command configurable limits: dice=10/min, story=5/min)
  - Create `src/config/rate-limits.ts` — Rate limit configuration
  - Write TDD tests: queue ordering, rate limiting, concurrent access safety

  **Must NOT do**:
  - Do NOT implement global Discord rate limiting — discord.js handles that
  - Do NOT use Redis — in-memory Map is sufficient for personal project
  - Do NOT block commands from different users — only per-user queuing

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T13, T14, T15, T16)
  - **Parallel Group**: Wave 3
  - **Blocks**: T18, T21
  - **Blocked By**: T2

  **References**:
  **External References**:
  - Discord rate limits: `https://discord.com/developers/docs/topics/rate-limits`

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/services/queue* tests/services/rate-limiter*` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Per-user queue processes sequentially, different users concurrent
    Tool: Bun test
    Steps:
      1. Enqueue 3 commands for user "player1" → execute in order
      2. Enqueue 2 commands for user "player2" → execute concurrently with player1
      3. Assert: no cross-user blocking
    Expected Result: Sequential per user, concurrent across users
    Evidence: .sisyphus/evidence/task-17-command-queue.txt

  Scenario: Rate limiter enforces per-command limits
    Tool: Bun test
    Steps:
      1. Consume 10 dice limits → 11th returns false
      2. Consume 5 story limits → 6th returns false
      3. Assert: dice and story limits are independent
    Expected Result: Per-command rate limits enforced independently
    Evidence: .sisyphus/evidence/task-17-rate-limiter.txt
  ```

  **Commit**: YES
  - Message: `feat(bot): add command queue and rate limiter`
  - Files: `src/services/queue.ts`, `src/services/rate-limiter.ts`, `src/config/rate-limits.ts`, `tests/services/`

- [x] 18. Multiplayer Mode Handlers

  **What to do**:
  - Create `src/services/multiplayer/types.ts` — MultiplayerMode enum + interfaces
  - Create `src/services/multiplayer/shared-session.ts` — SharedSessionHandler (DM-orchestrated turn-based, Avrae pattern)
  - Create `src/services/multiplayer/persistent-world.ts` — PersistentWorldHandler (regular channels NOT threads, any-player-can-act)
  - Create `src/services/multiplayer/async.ts` — AsyncHandler (queue actions, DM resolves)
  - Create `src/services/multiplayer/factory.ts` — MultiplayerHandlerFactory (returns correct handler per mode, switchable per-campaign)
  - Write TDD tests for all three modes

  **Must NOT do**:
  - Do NOT use Discord threads for persistent world (they auto-archive)
  - Do NOT implement real-time combat (start DM-orchestrated turn-based)
  - Do NOT implement cross-shard state (single shard for personal project)
  - Do NOT implement DM isolation for shared state — guild channels for shared, DMs for private

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Three distinct multiplayer modes with different state management and interaction patterns
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: T22
  - **Blocked By**: T17, T13, T9

  **References**:
  **Pattern References**:
  - Avrae battle tracking: channel-scoped, DM-advances turns, persistent in DB
  - `src/services/campaign.ts` — CampaignService
  - `src/services/queue.ts` — CommandQueue

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/services/multiplayer/` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Shared session turn-based flow (DM-orchestrated)
    Tool: Bun test
    Steps:
      1. Start session with DM and 3 players
      2. Players submit actions, DM advances turn
      3. Assert: actions processed in order, turn advances
    Expected Result: Turn-based session processes player actions in order
    Evidence: .sisyphus/evidence/task-18-shared-session.txt

  Scenario: Persistent world allows any-time actions (no turn order)
    Tool: Bun test
    Steps:
      1. Player1 and Player2 both submit actions
      2. Both processed independently (no turn order)
      3. Player1 leaves → character state persists
    Expected Result: Actions processed as they come, state persists
    Evidence: .sisyphus/evidence/task-18-persistent-world.txt

  Scenario: Async mode queues and resolves on DM trigger
    Tool: Bun test
    Steps:
      1. Player1 and Player2 queue actions
      2. DM triggers resolve → both actions batched together
    Expected Result: Actions queued, resolved in batch
    Evidence: .sisyphus/evidence/task-18-async-mode.txt
  ```

  **Commit**: YES
  - Message: `feat(multiplayer): implement shared session, persistent world, async modes`
  - Files: `src/services/multiplayer/`, `tests/services/multiplayer/`

- [x] 19. Slash Commands — Character Management

  **What to do**:
  - Create character slash commands:
    - `/character create` — name, class, system, backstory options; deferReply(); render character sheet embed; ephemeral option
    - `/character sheet` — show full character sheet (ephemeral); use EmbedPaginator
    - `/character list` — list all user's characters with mini-embeds
    - `/character update` — update stats/inventory/backstory; validate by RPG system
    - `/character delete` — confirmation required; ephemeral confirmation message
  - Wire commands into command handler
  - Write TDD tests: command registration, option parsing, service call, embed rendering

  **Must NOT do**:
  - Do NOT render character data as plain text — always embeds
  - Do NOT skip deferReply() for any service-calling command
  - Do NOT allow other users to see private character sheets
  - Do NOT create combat commands (that's T21)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T20, T21)
  - **Parallel Group**: Wave 4
  - **Blocks**: T22
  - **Blocked By**: T8, T9, T16

  **References**:
  **Pattern References**:
  - `src/commands/ping.ts` — Command structure pattern
  - `src/embeds/renderers/character.ts` — Character embed renderers
  - `src/services/character.ts` — CharacterService

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/commands/character/` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: /character create works end-to-end
    Tool: Bun test (mock interaction + services)
    Steps:
      1. Execute /character create with name="Aragorn", class="Fighter", system="dnd5e"
      2. Assert: deferReply() called, CharacterService called, editReply() with embed
      3. Assert: embed within Discord limits
    Expected Result: Character created, embed response shown
    Evidence: .sisyphus/evidence/task-19-character-create.txt

  Scenario: Character sheets are private (ephemeral)
    Tool: Bun test
    Steps:
      1. Owner calls /character sheet → assert ephemeral reply with full sheet
      2. Non-owner → assert access denied
    Expected Result: Private character data, ephemeral replies
    Evidence: .sisyphus/evidence/task-19-character-privacy.txt
  ```

  **Commit**: YES
  - Message: `feat(commands): add character management slash commands`
  - Files: `src/commands/character/`, `tests/commands/character/`

- [x] 20. Slash Commands — Campaign and Story

  **What to do**:
  - Create campaign slash commands:
    - `/campaign create` — name, system, mode, description; render campaign status embed
    - `/campaign join` — add player to campaign
    - `/campaign leave` — remove player from campaign
    - `/campaign status` — display campaign info, world state, player list (EmbedPaginator for large states)
    - `/campaign end` — DM-only, confirmation required
  - Create story slash commands:
    - `/story advance` — action input, deferReply(), call LLMOrchestrator, render narrative embed
    - `/story summary` — story summary so far (EmbedPaginator)
  - Wire all commands into command handler
  - Write TDD tests

  **Must NOT do**:
  - Do NOT allow non-DMs to end campaigns
  - Do NOT skip deferReply() for /story advance (LLM call)
  - Do NOT use threads for persistent world campaigns

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T19, T21)
  - **Parallel Group**: Wave 4
  - **Blocks**: T22
  - **Blocked By**: T13, T14, T16

  **References**:
  **Pattern References**:
  - `src/commands/character/create.ts` — Command pattern from T19
  - `src/embeds/renderers/campaign.ts` — Campaign embed renderers
  - `src/services/llm/orchestrator.ts` — LLMOrchestrator

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/commands/campaign* tests/commands/story*` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Campaign create → join → status flow
    Tool: Bun test (mock interaction)
    Steps:
      1. /campaign create → assert campaign created, embed shown
      2. /campaign join → assert player added
      3. /campaign status → assert embed with campaign info
    Expected Result: Full campaign lifecycle works
    Evidence: .sisyphus/evidence/task-20-campaign-flow.txt

  Scenario: /story advance calls LLM and renders response
    Tool: Bun test (mock LLM)
    Steps:
      1. /story advance action="I open the door"
      2. Assert: deferReply() called, LLM called, editReply() with narrative embed
    Expected Result: Story advance calls LLM, renders response
    Evidence: .sisyphus/evidence/task-20-story-advance.txt
  ```

  **Commit**: YES
  - Message: `feat(commands): add campaign and story slash commands`
  - Files: `src/commands/campaign/`, `src/commands/story/`, `tests/commands/`

- [x] 21. Slash Commands — Gameplay (Dice, Explore, Combat)

  **What to do**:
  - Create gameplay slash commands:
    - `/dice roll` — notation, modifier, advantage, disadvantage options; render dice embed
    - `/explore` — action input; deferReply(); call LLM; render exploration embed
    - `/combat start` — initiate combat; render battle state embed
    - `/combat attack` — player attacks; RPG engine resolves; render result embed
    - `/combat defend` — player defends; render defense result embed
    - `/combat cast` — cast spell/ability; D&D 5e or Custom system; render result
    - `/combat end` — end combat encounter
    - `/skill check` — skill, modifier options; 1d20 + modifier; render result embed
    - `/inventory add/remove/list/use` — inventory management commands
  - Wire all commands into command handler
  - Write TDD tests

  **Must NOT do**:
  - Do NOT implement real-time multiplayer combat (that's T18 mode handlers)
  - Do NOT implement complex spell systems yet
  - Do NOT skip deferReply() for any LLM-invoking command
  - Do NOT render results as plain text — always embeds

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T19, T20)
  - **Parallel Group**: Wave 4
  - **Blocks**: T22
  - **Blocked By**: T9, T15, T14, T16, T17

  **References**:
  **Pattern References**:
  - `src/services/rpg/dice-cli.ts` — DiceCli
  - `src/services/rpg/dnd5e.ts` — DnD5eEngine (attack, defense, skill calculations)
  - `src/embeds/renderers/battle.ts` — Battle embed renderer

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/commands/gameplay/` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: /dice roll with various notations
    Tool: Bun test
    Steps:
      1. /dice roll "2d6+3" → shows individual dice + modifier + total
      2. /dice roll "1d20" advantage=true → shows two rolls, keeps higher
      3. /dice roll "4d6kh3" → shows 4 rolls, keeps highest 3
    Expected Result: All dice notations handled correctly
    Evidence: .sisyphus/evidence/task-21-dice-roll.txt

  Scenario: /combat attack delegated to RPG engine
    Tool: Bun test (mock RPG engine)
    Steps:
      1. /combat attack target="goblin"
      2. Assert: RPG engine calculates attack roll vs AC
      3. Assert: embed shows hit/miss + damage
    Expected Result: Combat commands delegated to RPG engine for resolution
    Evidence: .sisyphus/evidence/task-21-combat-attack.txt
  ```

  **Commit**: YES
  - Message: `feat(commands): add gameplay slash commands`
  - Files: `src/commands/gameplay/`, `tests/commands/gameplay/`

- [ ] 22. End-to-End Integration + Bot Wiring

  **What to do**:
  - Create `src/wiring.ts` — Dependency injection (manual, not framework):
    - Initialize all services in order: DB → Repos → Services → MCP → LLM → Commands
    - Wire PrismaClient, repositories, services, MCP, LLM, commands
  - Update `src/index.ts` — Entry point:
    - Load wiring, register commands, start Discord bot, start MCP server
    - Graceful shutdown: disconnect Discord, close DB, stop MCP
  - Update `src/events/interactionCreate.ts` — Route all commands via queue + rate limiter
  - Create `src/events/error.ts` — Global error handler (log, reconnect on connection errors)
  - Create `src/utils/logger.ts` — Structured logging [timestamp] [level] [context] message
  - Integration test: start bot, /ping → pong
  - Integration test: full flow: create character → create campaign → advance story → roll dice

  **Must NOT do**:
  - Do NOT use DI framework — manual wiring is simpler and explicit
  - Do NOT start services in wrong order (DB first)
  - Do NOT forget graceful shutdown
  - Do NOT log sensitive data (API keys, tokens)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Full integration wiring, dependency ordering, error handling
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on ALL previous tasks)
  - **Parallel Group**: Wave 5
  - **Blocks**: T23
  - **Blocked By**: T18, T19, T20, T21

  **Acceptance Criteria**:
  **If TDD**:
  - [ ] `bun test tests/integration/` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Bot starts and responds to /ping
    Tool: Bash (live bot test)
    Steps:
      1. `docker compose up -d`
      2. Wait 10s, send /ping in test Discord channel
      3. Assert: bot responds with Pong! embed within 5s
    Expected Result: Bot starts and responds to basic command
    Evidence: .sisyphus/evidence/task-22-bot-start.txt

  Scenario: Full gameplay flow end-to-end
    Tool: Bash (live bot test)
    Steps:
      1. /character create → assert character sheet embed
      2. /campaign create → assert campaign status embed
      3. /story advance → assert narrative embed (or LLM timeout)
      4. /dice roll "1d20+5" → assert dice result embed
    Expected Result: All commands work in sequence
    Evidence: .sisyphus/evidence/task-22-full-flow.txt
  ```

  **Commit**: YES
  - Message: `feat(integration): wire all services end-to-end`
  - Files: `src/wiring.ts`, `src/index.ts`, `src/events/`, `src/utils/logger.ts`, `tests/integration/`

- [ ] 23. Docker Compose + Deployment Config

  **What to do**:
  - Update `docker-compose.yml` with full services:
    - `bot`: Bun runtime, depends on postgres, env from .env
    - `postgres`: PostgreSQL 16 + pgvector (`pgvector/pgvector:pg16` image), volume, health check
    - Internal network only (postgres not exposed publicly)
  - Create `Dockerfile` — multi-stage build (install → build → run)
  - Create `.dockerignore`
  - Create `scripts/wait-for-postgres.sh` — health check before bot starts
  - Update `package.json` scripts: `docker:build`, `docker:up`, `docker:down`, `docker:logs`
  - Verify: `docker compose up` starts all services, bot connects to Discord

  **Must NOT do**:
  - Do NOT include .env in Docker image
  - Do NOT expose PostgreSQL port publicly
  - Do NOT use `latest` tag for base images — pin versions
  - Do NOT skip health checks

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4
  - **Blocked By**: T22

  **Acceptance Criteria**:
  - [ ] `docker compose config` validates
  - [ ] `docker compose up -d` starts all services

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Docker Compose starts all services
    Tool: Bash
    Steps:
      1. `docker compose up -d`
      2. Assert: postgres healthy, bot running
      3. Assert: bot logs show "Bot logged in"
    Expected Result: All services start, bot connects to Discord
    Evidence: .sisyphus/evidence/task-23-docker-up.txt

  Scenario: Bot waits for postgres before starting
    Tool: Bash
    Steps:
      1. `docker compose restart bot`
      2. Assert: bot waits for postgres health check
      3. Assert: bot connects to Discord successfully
    Expected Result: Graceful startup with database dependency
    Evidence: .sisyphus/evidence/task-23-health-check.txt
  ```

  **Commit**: YES
  - Message: `feat(deploy): add Docker Compose configuration`
  - Files: `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `scripts/`, `package.json`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **T1**: `feat(init): scaffold project with TypeScript, discord.js, and config`
- **T2**: `feat(bot): add Discord bot core and slash command handler`
- **T3**: `feat(types): add shared Zod schemas and TypeScript types`
- **T4**: `feat(db): setup PostgreSQL schema and Prisma ORM`
- **T5**: `feat(ui): add EmbedBuilder utilities and EmbedPaginator`
- **T6**: `feat(mcp): scaffold MCP server with stdio transport`
- **T7**: `feat(db): add character, campaign, story repositories`
- **T8**: `feat(character): implement character service with CRUD and stats`
- **T9**: `feat(rpg): implement dual RPG system engine`
- **T10**: `feat(context): implement token counter and compression pipeline`
- **T11**: `feat(mcp): register MCP tools and resources for story/campaign`
- **T12**: `feat(llm): integrate LangChain.js with custom endpoint and memory`
- **T13**: `feat(story): implement campaign and story engine service`
- **T14**: `feat(llm): implement LLM orchestration with context management`
- **T15**: `feat(dice): implement dice and math expression engine`
- **T16**: `feat(ui): implement game embed renderers`
- **T17**: `feat(bot): add command queue and rate limiter`
- **T18**: `feat(multiplayer): implement shared session, persistent world, async modes`
- **T19**: `feat(commands): add character management slash commands`
- **T20**: `feat(commands): add campaign and story slash commands`
- **T21**: `feat(commands): add gameplay slash commands`
- **T22**: `feat(integration): wire all services end-to-end`
- **T23**: `feat(deploy): add Docker Compose configuration`

---

## Success Criteria

### Verification Commands

```bash
bun test                    # Expected: All tests pass
bun run build               # Expected: TypeScript compiles without errors
docker compose up -d        # Expected: bot + postgres + mcp start
docker compose logs bot     # Expected: "Bot logged in as DungeonAndSlop#1234"
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
