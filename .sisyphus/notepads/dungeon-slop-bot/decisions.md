# Decisions — Dungeon and Slop Bot

- Language: TypeScript + Node.js (Bun runtime)
- LLM Endpoint: Custom API + OpenRouter option
- Multiplayer: All three modes (shared session, persistent world, async)
- RPG System: Dual-mode (D&D 5e + Custom Simple), per-campaign toggle
- Database: PostgreSQL + pgvector
- Framework: LangChain.js for LLM, MCP as internal API
- Commands: Slash-only
- Testing: TDD with bun test
- Deployment: Docker Compose
- Scope: Personal project for friends, no web/music/monetization/mobile
- EmbedPaginator: Mandatory for all embeds (Avrae pattern)
- Context: 32k max, hierarchical compression