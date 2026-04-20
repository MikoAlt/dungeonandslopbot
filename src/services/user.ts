import type { User } from '../generated/prisma/client.js';
import type { UserRepository } from '../db/repositories/user.js';

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async ensureByDiscordId(discordId: string, username: string): Promise<User> {
    return this.repo.upsertByDiscordId(discordId, username);
  }
}
