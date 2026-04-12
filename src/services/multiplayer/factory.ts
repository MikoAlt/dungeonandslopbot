import { type MultiplayerHandler, type MultiplayerMode, MultiplayerMode as Mode } from './types.js';
import { SharedSessionHandler } from './shared-session.js';
import { PersistentWorldHandler } from './persistent-world.js';
import { AsyncHandler } from './async.js';

export interface HandlerConfig {
  campaignId: string;
  mode: MultiplayerMode;
  dmUserId?: string;
  players?: string[];
}

const VALID_MODE_TRANSITIONS: Record<MultiplayerMode, MultiplayerMode[]> = {
  [Mode.SHARED_SESSION]: [Mode.PERSISTENT_WORLD, Mode.ASYNC],
  [Mode.PERSISTENT_WORLD]: [Mode.SHARED_SESSION, Mode.ASYNC],
  [Mode.ASYNC]: [Mode.SHARED_SESSION, Mode.PERSISTENT_WORLD],
};

export class MultiplayerHandlerFactory {
  private handlers: Map<string, MultiplayerHandler> = new Map();

  createHandler(config: HandlerConfig): MultiplayerHandler {
    const { campaignId, mode, dmUserId, players } = config;

    const existing = this.handlers.get(campaignId);
    if (existing) {
      if (existing.getMode() === mode) {
        return existing;
      }
      const newHandler = this.switchModeInternal(campaignId, existing.getMode(), mode);
      this.handlers.set(campaignId, newHandler);
      return newHandler;
    }

    let handler: MultiplayerHandler;
    switch (mode) {
      case Mode.SHARED_SESSION:
        if (!dmUserId) {
          throw new Error('dmUserId required for sharedSession mode');
        }
        handler = new SharedSessionHandler({ campaignId, dmUserId });
        break;
      case Mode.PERSISTENT_WORLD:
        handler = new PersistentWorldHandler({ campaignId, players: players ?? [] });
        break;
      case Mode.ASYNC:
        handler = new AsyncHandler(players ?? []);
        break;
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    this.handlers.set(campaignId, handler);
    return handler;
  }

  switchMode(campaignId: string, newMode: MultiplayerMode): MultiplayerHandler {
    const existing = this.handlers.get(campaignId);
    if (!existing) {
      throw new Error(`No handler found for campaign ${campaignId}`);
    }

    const currentMode = existing.getMode();
    if (currentMode === newMode) {
      return existing;
    }

    const allowedTransitions = VALID_MODE_TRANSITIONS[currentMode];
    if (!allowedTransitions.includes(newMode)) {
      throw new Error(
        `Cannot transition from ${currentMode} to ${newMode}. Allowed: ${allowedTransitions.join(', ')}`,
      );
    }

    const newHandler = this.switchModeInternal(campaignId, currentMode, newMode);
    this.handlers.set(campaignId, newHandler);
    return newHandler;
  }

  private switchModeInternal(
    campaignId: string,
    fromMode: MultiplayerMode,
    toMode: MultiplayerMode,
  ): MultiplayerHandler {
    switch (toMode) {
      case Mode.SHARED_SESSION:
        return new SharedSessionHandler({ campaignId, dmUserId: 'dm' });
      case Mode.PERSISTENT_WORLD:
        return new PersistentWorldHandler({ campaignId, players: [] });
      case Mode.ASYNC:
        return new AsyncHandler([]);
      default:
        throw new Error(`Unknown mode: ${toMode}`);
    }
  }

  getHandler(campaignId: string): MultiplayerHandler | undefined {
    return this.handlers.get(campaignId);
  }

  removeHandler(campaignId: string): void {
    this.handlers.delete(campaignId);
  }
}
