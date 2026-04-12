import {
  type MultiplayerHandler,
  type TurnState,
  type AsyncAction,
  MultiplayerMode,
} from './types.js';

export interface SharedSessionConfig {
  campaignId: string;
  dmUserId: string;
}

export class SharedSessionHandler implements MultiplayerHandler {
  private turnState: TurnState | null = null;
  private pendingActions: Map<string, AsyncAction[]> = new Map();
  private config: SharedSessionConfig;

  constructor(config: SharedSessionConfig) {
    this.config = config;
  }

  getMode(): MultiplayerMode {
    return MultiplayerMode.SHARED_SESSION;
  }

  getActivePlayers(): string[] {
    return this.turnState?.turnOrder ?? [];
  }

  isPlayerActive(userId: string): boolean {
    if (!this.turnState) return false;
    return this.turnState.turnOrder.includes(userId);
  }

  startSession(dmUserId: string, playerIds: string[]): TurnState {
    if (playerIds.length === 0) {
      throw new Error('Cannot start session with no players');
    }

    const turnState: TurnState = {
      currentTurn: 1,
      turnOrder: playerIds,
      currentPlayer: playerIds[0]!,
    };

    this.turnState = turnState;
    this.pendingActions.clear();

    return { ...turnState };
  }

  submitAction(userId: string, action: string): void {
    if (!this.turnState) {
      throw new Error('Session not started');
    }

    if (this.turnState.currentPlayer !== userId) {
      throw new Error(`Not ${userId}'s turn. Current turn: ${this.turnState.currentPlayer}`);
    }

    const turnKey = String(this.turnState.currentTurn);
    const actions = this.pendingActions.get(turnKey) ?? [];

    actions.push({
      id: crypto.randomUUID(),
      userId,
      action,
      timestamp: new Date(),
    });

    this.pendingActions.set(turnKey, actions);
  }

  advanceTurn(): TurnState {
    if (!this.turnState) {
      throw new Error('Session not started');
    }

    const prevTurn = this.turnState.currentTurn;
    const nextTurnIndex = this.turnState.turnOrder.indexOf(this.turnState.currentPlayer) + 1;
    const isLastPlayer = nextTurnIndex >= this.turnState.turnOrder.length;

    if (isLastPlayer) {
      this.turnState = {
        currentTurn: this.turnState.currentTurn + 1,
        turnOrder: this.turnState.turnOrder,
        currentPlayer: this.turnState.turnOrder[0]!,
      };
      this.pendingActions.delete(String(prevTurn));
    } else {
      this.turnState = {
        ...this.turnState,
        currentPlayer: this.turnState.turnOrder[nextTurnIndex]!,
      };
    }

    return { ...this.turnState };
  }

  getCurrentTurn(): TurnState {
    if (!this.turnState) {
      throw new Error('Session not started');
    }
    return { ...this.turnState };
  }

  getPendingActions(turn: number): AsyncAction[] {
    return this.pendingActions.get(String(turn)) ?? [];
  }
}
