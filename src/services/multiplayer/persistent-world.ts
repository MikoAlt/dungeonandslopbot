import { type MultiplayerHandler, MultiplayerMode } from './types.js';

export interface PersistentWorldConfig {
  campaignId: string;
  players: string[];
}

export class PersistentWorldHandler implements MultiplayerHandler {
  private players: Set<string>;

  constructor(config: PersistentWorldConfig) {
    this.players = new Set(config.players);
  }

  getMode(): MultiplayerMode {
    return MultiplayerMode.PERSISTENT_WORLD;
  }

  getActivePlayers(): string[] {
    return Array.from(this.players);
  }

  isPlayerActive(userId: string): boolean {
    return this.players.has(userId);
  }

  addPlayer(userId: string): void {
    this.players.add(userId);
  }

  removePlayer(userId: string): void {
    this.players.delete(userId);
  }

  updatePlayers(playerIds: string[]): void {
    this.players = new Set(playerIds);
  }
}
