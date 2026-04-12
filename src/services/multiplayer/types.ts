/**
 * Multiplayer mode handlers for dungeon and slop bot.
 *
 * Three modes:
 * - sharedSession: DM-orchestrated turn-based (Avrae pattern)
 * - persistentWorld: Any player can act at any time, state persists
 * - async: Queue actions, DM resolves in batch
 */

export const MultiplayerMode = {
  SHARED_SESSION: 'sharedSession',
  PERSISTENT_WORLD: 'persistentWorld',
  ASYNC: 'async',
} as const;

export type MultiplayerMode = (typeof MultiplayerMode)[keyof typeof MultiplayerMode];

/**
 * Interface for all multiplayer handlers.
 */
export interface MultiplayerHandler {
  /**
   * Get the multiplayer mode for this handler.
   */
  getMode(): MultiplayerMode;

  /**
   * Get the list of active players in the session/campaign.
   */
  getActivePlayers(): string[];

  /**
   * Check if a specific player is currently active.
   */
  isPlayerActive(userId: string): boolean;
}

/**
 * Turn-based session state.
 */
export interface TurnState {
  /** Current turn number (1-indexed) */
  currentTurn: number;
  /** Ordered list of player userIds */
  turnOrder: string[];
  /** userId of the player whose turn it is */
  currentPlayer: string;
}

/**
 * An action submitted by a player in async or turn-based mode.
 */
export interface AsyncAction {
  /** Unique identifier for the action */
  id: string;
  /** userId of the player who submitted the action */
  userId: string;
  /** Action description/data */
  action: string;
  /** When the action was submitted */
  timestamp: Date;
}

/**
 * Result of resolving a batch of async actions.
 */
export interface ResolveResult {
  /** Resolved actions */
  actions: AsyncAction[];
  /** Summary message from DM resolution */
  summary: string;
}
