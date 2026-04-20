import { describe, it, expect, beforeEach } from 'bun:test';
import type { User } from '../../src/generated/prisma/client.js';
import type { UserRepository } from '../../src/db/repositories/user.js';
import { UserService } from '../../src/services/user.js';

function createMockRepository(): UserRepository {
  const users = new Map<string, User>();
  let idCounter = 1;

  return {
    async findByDiscordId(discordId: string) {
      return users.get(discordId) ?? null;
    },
    async upsertByDiscordId(discordId: string, username: string) {
      const existing = users.get(discordId);
      if (existing) {
        const updated: User = { ...existing, username, updatedAt: new Date() };
        users.set(discordId, updated);
        return updated;
      }
      const created: User = {
        id: `user-${idCounter++}`,
        discordId,
        username,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(discordId, created);
      return created;
    },
  };
}

describe('UserService', () => {
  let service: UserService;
  let repo: UserRepository;

  beforeEach(() => {
    repo = createMockRepository();
    service = new UserService(repo);
  });

  describe('ensureByDiscordId', () => {
    it('creates and returns new user when discordId does not exist', async () => {
      const user = await service.ensureByDiscordId('discord-123', 'NewPlayer');

      expect(user.discordId).toBe('discord-123');
      expect(user.username).toBe('NewPlayer');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('returns existing user when discordId already exists', async () => {
      // First, create a user
      const created = await service.ensureByDiscordId('discord-456', 'ExistingPlayer');
      expect(created.discordId).toBe('discord-456');

      // Now, call ensureByDiscordId again - should return existing user (upsert find case)
      const existing = await service.ensureByDiscordId('discord-456', 'ExistingPlayer');

      expect(existing.id).toBe(created.id);
      expect(existing.discordId).toBe('discord-456');
      expect(existing.username).toBe('ExistingPlayer');
    });

    it('updates username when user already exists but username is different', async () => {
      // Create initial user
      await service.ensureByDiscordId('discord-789', 'OldName');

      // Update with new username
      const updated = await service.ensureByDiscordId('discord-789', 'NewName');

      expect(updated.username).toBe('NewName');
    });
  });
});
