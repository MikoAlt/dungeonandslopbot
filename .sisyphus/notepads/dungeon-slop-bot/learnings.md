# Learnings — Dungeon and Slop Bot

## Conventions

- Bun runtime (not Node.js)
- Bun test framework (Vitest-compatible)
- TypeScript strict mode
- discord.js v14 with SlashCommandBuilder
- MCP SDK @modelcontextprotocol/sdk with StdioServerTransport
- LangChain.js for LLM orchestration
- PostgreSQL + pgvector via Prisma
- All rendering in Discord embeds (EmbedPaginator mandatory)
- deferReply() for ALL LLM-invoking commands
- Ephemeral for private data, public for shared data (decide upfront per command)
- Regular channels (NOT threads) for persistent world campaigns
- Per-user command queue to prevent race conditions
- Per-campaign RPG system toggle (dnd5e or custom)
- DM-orchestrated turn-based for shared session (Avrae pattern)

## Gotchas

- Discord embed limits: 6000 chars total, 25 fields, title 256, description 4096, field value 1024
- Ephemeral responses lock ALL followups to ephemeral (cannot switch mid-interaction)
- Thread auto-archive kills persistent world campaigns — use regular channels
- pgvector requires Unsupported("vector") type in Prisma schema
- Context budget: 2k system + 4k world + 10k recent + 12k RAG + 4k headroom = 32k
- Token estimation: ~4 chars per token (heuristic, not tiktoken)

## T1 Patterns

- Config module should export envSchema + loadConfig() separately (no auto-load on import) to enable TDD testing
- Use .url() for URL validation, .min(1) for strings, .default() for optional defaults
- Export types with z.infer<typeof schema> pattern
- Module-level config = tests fail without env vars — use functional approach

## T3 Patterns (Zod Schemas)

- Tests directory is excluded from tsconfig.json — use relative paths carefully (tests/types/ needs ../../src/ not ../src/)
- Zod .default() applies when field is undefined, not when missing entirely from object
- For union types with z.union(), the validated object uses discriminated union based on rpgSystem field
- MCP tool inputSchema directly uses Zod schemas — no need for separate validation
- Export barrel from index.ts with .js extensions for ESM compatibility
- D&D 5e stats: abilities 1-30, AC/speed non-negative integers

## T2 Patterns (Discord Bot Core)

- createReadyHandler(commands) factory pattern allows passing commands to event handler (since loadCommands is async)
- interactionCreate.ts receives commands Map as second param for routing
- Use MessageFlags.Ephemeral from discord.js (not deprecated `ephemeral: true`)
- File-based command loading: skip index.ts, only load .ts files
- Bun test: vi.mocked not available — use simpler test approach
- Bun test filters need exact path — `bun test tests/handlers/` doesn't work, must use full path

## T4 Patterns (Prisma + PostgreSQL)

- Prisma generates client to `src/generated/prisma/` when output is specified in generator config
- Import client from `../../src/generated/prisma/client.js` (NOT `index.js`)
- Prisma schema uses `Unsupported("vector(1536)")` for pgvector columns
- Seed script uses ESM import with `.js` extension for generated client
- Prisma 6+ uses `prisma.config.ts` instead of `package.json#prisma` for seed config
- Migration requires running PostgreSQL — validate schema with `bunx prisma validate`
- Tests use vi.mock() with path matching import path in test file

## T6 Patterns (MCP Server)

- McpServer from @modelcontextprotocol/sdk/server/mcp.js
- StdioServerTransport from @modelcontextprotocol/sdk/server/stdio.js
- registerTool(name, config, callback) where config has { description, inputSchema }
- registerResource(name, uri, config, callback) where callback receives URL
- MCP tool response: { content: [{ type: "text", text: "..." }] }
- MCP resource response: { contents: [{ uri: string, text: string, mimeType: string }] }
- Zod schemas with .strict() reject extra keys (z.object({}).strict())
- Export handler functions separately to enable unit testing (MCP SDK doesn't expose internal registry)
- Server capabilities are registered internally — test handlers directly by exporting them

## T5 Patterns (Embed Utilities + EmbedPaginator)

- EmbedBuilder.length property includes title + description + fields + footer + author name
- Discord embed limits: total 6000 chars, 25 fields, title 256, description 4096, field value 1024, field name 256
- EmbedPaginator critical bug patterns:
  - When splitting, push OLD currentEmbed to embeds BEFORE creating new one
  - JavaScript objects are passed by reference — modifying currentEmbed after pushing to embeds modifies the embedded object too
  - Fix: push OLD embed, then create NEW currentEmbed as separate object, then add field to NEW
- finalizeCurrentEmbed() should only push if there are FIELDS (title-only embeds shouldn't be pushed)
- Description splitting: set description BEFORE pushing to embeds for next chunk (else you lose the description)
- Text splitting at boundaries: try paragraph (\n\n), then sentence (. ), then word (space), then hard split at maxLength
- addFieldSafe in builder.ts truncates both name AND value to Discord limits (spec only mentions value, but name >256 causes API error)
- addFieldToCurrentEmbed checks both field count AND accumulated embed length to prevent oversized embeds
- build() should only include currentEmbed in result if it has actual content (title/description/fields)
- Footer should only be set on the LAST embed (iterate result, set footer on result[result.length-1])

## T10 Patterns (Context Manager)

- Test imports from `tests/services/context/` need `../../../src/` (3 levels up, not 2)
- Bun resolves `.ts` imports directly — no `.js` extension needed in test imports
- Source files use `.js` extensions in their own imports (ESM compatibility)
- Token counting heuristic: Math.ceil(text.length / 4) — 4 chars ≈ 1 token
- truncateToTokens breaks at newline (>80% threshold), then space (>80%), then hard cut
- MessageStore interface enables testability — mock store for unit tests without DB
- ContextManager.selectRecentMessages sorts newest-first, accumulates until budget exhausted, then reverses
- Compression: summarize older messages → append to worldState.events, keep recent window
- selectRelevantHistory is placeholder (returns []) — actual pgvector impl in T7
- summarizeMessages is placeholder (concatenates) — actual LLM impl in T14
- isWithinBudget checks against MAX_CONTEXT - RESPONSE_HEADROOM (28000 usable tokens)

## T11 Patterns (MCP Tools & Resources)

- Custom protocol URLs (dungeon://) parse with hostname as the first segment and pathname starting with /
  - e.g., dungeon://campaigns/camp_123 → hostname: "campaigns", pathname: "/camp_123"
  - Extract ID from pathname with .replace(/^\//, '') to strip leading slash
  - For nested paths like dungeon://campaigns/camp_abc/world-state → pathname: "/camp_abc/world-state"
- Separate handlers.ts from tools.ts/resources.ts for testability — handlers are pure functions, easy to unit test
- registerTools() and registerResources() as separate functions called from createMcpServer() keeps server.ts clean
- Placeholder handlers return { content: [{ type: "text", text: JSON.stringify({...}) }] } pattern for deferred service wiring
- Resource handlers receive URL object — parse ID from pathname, not from hostname
- Export errorResponse helper for testing validation error flows
- z.record(z.unknown()) for flexible update payloads (character updates, world state)
- All 11 tools + 4 resources registered, 72 tests passing

## T9 Patterns (RPG System Engine)

- Bun test import paths: from `tests/services/rpg/` use `../../../src/` (3 levels up), not `../../src/`
- `noUncheckedIndexedAccess` in tsconfig means array bracket access returns `T | undefined` — use direct values or non-null assertions
- Regex match groups are `string | undefined` in strict mode — always null-check before use
- D&D 5e ability modifier uses `Math.floor` (round down), NOT `Math.trunc` (round toward zero) — they differ for negative numbers
- Custom Simple system is genuinely different from D&D: hp/attack/defense/speed/special vs ability scores, level-up choices (hp/attack/defense) vs ASI, attack vs defense damage model vs AC model
- RPGEngine interface uses generic type parameter for stats type, with overloaded `getEngine()` signatures for type-safe factory
- Test randomness: use conditional checks (e.g., `if (result.attackRoll === 20)`) rather than mocking for dice rolls

## T7 Patterns (Database Repositories)

- BaseRepository uses callback-based operations pattern — Prisma delegate types are too complex for a simple interface due to SelectSubset generics
- Pass arrow functions wrapping Prisma calls to BaseRepository constructor: `findUnique: (id) => prisma.character.findUnique({ where: { id } })`
- EmbeddingRepository doesn't extend BaseRepository — uses $queryRaw for pgvector operations (create, similarity search)
- Embedding model has Unsupported("vector(1536)") — can't use Prisma's create(), must use $queryRaw INSERT with ::vector cast
- $queryRaw returns arrays — always extract first element for single-row results
- Campaign players field is String[] — use spread + filter for addPlayer/removePlayer
- Story findByCampaignId uses findMany + take:1 since campaignId is not unique
- Message deleteOldMessages uses deleteMany (not delete) — returns { count } not the deleted records
- Mock PrismaClient with vi.mock() matching import path in test file (e.g., '../../../src/generated/prisma/client.js')
- Test mock pattern: vi.fn().mockResolvedValue() for async methods, vi.clearAllMocks() in beforeEach

## T12 Patterns (LangChain.js Integration)

- ChatOpenAI from @langchain/openai: use `configuration.basePath` for custom endpoint URL (not direct `baseUrl` param)
- ChatOpenAI property is `llm.model` (not `llm.modelName`) — `modelName` is the constructor kwarg, `model` is the runtime property
- LangChain `tool()` function from `@langchain/core/tools` uses Zod schemas for input validation — tool receives parsed input object
- Optional Zod fields in tool schemas: `input.modifier` is `undefined` when not provided, not `0` — use `?? 0` for defaults
- BufferMemory from `langchain/memory` with ChatMessageHistory for simple conversation storage — ConversationSummaryMemory deferred (requires LLM calls)
- ChatPromptTemplate.fromMessages() with SystemMessagePromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate for structured prompts
- BaseChatModel doesn't have `bindTools()` — use ChatOpenAI directly for chains that need tool binding
- `@langchain/openai` was already in node_modules (dependency of `langchain`) — no separate install needed
- Tool `invoke()` works with plain objects matching the Zod schema — no need for special wrapping
- Chain = prompt.pipe(llm) or prompt.pipe(llm.bindTools(tools)) — returns RunnableLambda for composition

## T8 Patterns (Character Service)

- D&D 5e ability modifier uses Math.floor (round toward negative infinity), NOT Math.trunc (round toward zero). Score 9 → modifier -1, score 7 → modifier -2. The task spec said "rounding toward zero" but actual D&D 5e and Python `//` both round down.
- CharacterService uses dependency injection with CharacterRepository interface — actual Prisma repo comes from T7
- Experience (XP) stored in stats JSON as `experience` field, stripped before Zod validation since schemas don't include it
- `withXp()` / `getXpFromStats()` / `stripXp()` helpers manage the experience field transparently
- Custom system XP threshold formula: 50 _ level _ (level - 1) (cumulative)
- D&D 5e XP thresholds: standard SRD array [0, 300, 900, 2700, ...355000]
- HP calculation: level 1 gets max hit die + con mod, subsequent levels get avg (floor(die/2)+1) + con mod, minimum 1 per level
- Test import paths from `tests/services/character/stats/` need `../../../../src/` (4 levels up), from `tests/services/` need `../../src/` (2 levels up)
- NotFoundError and ValidationError in `src/errors.ts` — shared error classes for services
- Mock repository pattern: in-memory Map-based implementation for testing CharacterService without Prisma
- Character Zod schema uses `z.string().uuid()` for id but Prisma generates CUIDs — discrepancy noted, not fixed in this task

## T17 Patterns (Command Queue + Rate Limiter)

- CommandQueue enqueue triggers async processing via queueMicrotask() — prevents synchronous execution from emptying queue before size() checks
- Token bucket algorithm: tokens refill based on elapsed time intervals, not continuously
- RateLimiter stores per-user, per-command-type buckets in a Map with composite key `${userId}:${commandType}`
- getResetTime() calculates when bucket will be full enough for 1 token using ceiling of tokens needed / refill rate
- Test import paths from `tests/services/` use `../../src/` (2 levels up)

## T13 Patterns (Campaign & Story Engine Service)

- CampaignService uses dependency injection with CampaignRepository interface — same pattern as CharacterService
- CampaignState uses in-memory Map<string, Campaign> cache — NOT Redis, per spec
- CampaignState.getActiveChannel() checks cache first, falls back to repo.findActiveByChannelId(), caches result
- CampaignService.createCampaign validates mode against VALID_MODES array before Zod validation
- CampaignService.joinCampaign checks players.includes(userId) before adding — throws ValidationError if already joined
- CampaignService.leaveCampaign checks players.includes(userId) before removing — throws ValidationError if not in list
- CampaignService.endCampaign invalidates cache after setting isActive=false
- StoryService.createStory validates with StorySchema (requires UUID for id and campaignId)
- StoryService.advanceScene: addScene → then update currentSceneIndex to scenes.length - 1
- StoryService.summarizeStory is placeholder — concatenates scene descriptions (actual LLM in T14)
- StoryService.rollbackScene: Math.max(0, currentSceneIndex - sceneCount)
- Mock repo pattern: preserve id from input data (don't override with counter) — tests need predictable IDs for lookups
- Test import paths from `tests/services/campaign/` need `../../../src/` (3 levels up)
- Zod `z.string()` allows empty strings — use `z.string().min(1)` or type mismatch for validation error tests
- CampaignRepository interface defined in state.ts (co-located with CampaignState) since service needs both

## T14 Patterns (LLM Orchestration Service)

- LLMOrchestrator uses dependency injection: ContextManager + BaseChatModel in constructor
- Added `getCampaign()` public method to ContextManager (was only on MessageStore interface before)
- Orchestrator calls `model.invoke([SystemMessage, HumanMessage])` directly instead of `prompt.pipe(model)` — simpler, more testable, avoids RunnableSequence mocking complexity
- `invokeWithFallback()` pattern: try primary LLM → if fails and openRouter configured → try OpenRouter → if that also fails, throw original error
- OpenRouter fallback creates real ChatOpenAI instance in constructor — can't easily mock in tests, so fallback tests verify error propagation only
- Response parser uses regex patterns: `[roll:XdY+Z]` and `[state:key=value]` / `[state:key+N]`
- `parseNarrativeResponse` strips markers AND cleans whitespace: replaces markers with single space, collapses multiple spaces, trims
- Prompt templates use `{{variable}}` syntax with `interpolateTemplate()` for simple string replacement — compatible with but separate from LangChain's `{variable}` syntax
- `createStoryPromptTemplate(rpgSystem)` selects DND5E or CUSTOM system prompt based on RPG system
- Mock LLM pattern for orchestrator tests: `{ invoke: vi.fn(() => Promise.resolve({ content: '...' })) }` — only need `invoke` method, not full LangChain Runnable interface
- Test import paths from `tests/services/llm/` need `../../../src/` (3 levels up)

## T18 Patterns (Multiplayer Mode Handlers)

- MultiplayerMode enum: 'sharedSession' | 'persistentWorld' | 'async'
- SharedSessionHandler: DM-orchestrated turn-based, players act in turn order, actions queued per turn
- PersistentWorldHandler: any player can act, no turn order, state persists in CampaignService
- AsyncHandler: queue actions, DM resolves in batch with resolveActions()
- MultiplayerHandlerFactory: creates handlers, supports mode switching with VALID_MODE_TRANSITIONS
- Factory requires beforeEach to create new factory instance (not shared across tests)
- SharedSession turn advances only clear pending actions when wrapping to new turn number (not when moving between players)
