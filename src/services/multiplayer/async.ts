import {
  type MultiplayerHandler,
  type AsyncAction,
  type ResolveResult,
  MultiplayerMode,
} from './types.js';

export class AsyncHandler implements MultiplayerHandler {
  private queue: AsyncAction[] = [];
  private players: Set<string>;

  constructor(players: string[] = []) {
    this.players = new Set(players);
  }

  getMode(): MultiplayerMode {
    return MultiplayerMode.ASYNC;
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

  queueAction(userId: string, action: string): AsyncAction {
    if (!this.players.has(userId)) {
      throw new Error(`User ${userId} is not a player in this async session`);
    }

    const asyncAction: AsyncAction = {
      id: crypto.randomUUID(),
      userId,
      action,
      timestamp: new Date(),
    };

    this.queue.push(asyncAction);
    return asyncAction;
  }

  getQueuedActions(): AsyncAction[] {
    return [...this.queue];
  }

  resolveActions(): ResolveResult {
    const actions = [...this.queue];
    const summary = `Resolved ${actions.length} action(s)`;
    return { actions, summary };
  }

  clearQueue(): void {
    this.queue = [];
  }
}
