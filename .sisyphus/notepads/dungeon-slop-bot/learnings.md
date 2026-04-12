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
