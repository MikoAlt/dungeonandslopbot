import { EventEmitter } from 'events';

export interface Command {
  id: string;
  execute(): Promise<unknown>;
}

type QueueEventType = 'start' | 'complete' | 'error';
type QueueListener = (userId: string, data?: unknown) => void;

export class CommandQueue {
  private queues: Map<string, Command[]>;
  private processing: Set<string>;
  private listeners: Map<QueueEventType, QueueListener[]>;

  constructor() {
    this.queues = new Map();
    this.processing = new Set();
    this.listeners = new Map();
  }

  enqueue(userId: string, command: Command): void {
    const queue = this.queues.get(userId) ?? [];
    queue.push(command);
    this.queues.set(userId, queue);

    if (!this.processing.has(userId)) {
      queueMicrotask(() => this.processQueue(userId));
    }
  }

  dequeue(userId: string): Command | undefined {
    const queue = this.queues.get(userId);
    if (!queue || queue.length === 0) {
      return undefined;
    }
    return queue.shift();
  }

  peek(userId: string): Command | undefined {
    const queue = this.queues.get(userId);
    if (!queue || queue.length === 0) {
      return undefined;
    }
    return queue[0];
  }

  size(userId: string): number {
    const queue = this.queues.get(userId);
    return queue?.length ?? 0;
  }

  clear(userId: string): void {
    this.queues.delete(userId);
  }

  async processQueue(userId: string): Promise<void> {
    if (this.processing.has(userId)) {
      return;
    }
    this.processing.add(userId);
    this.emit('start', userId);

    try {
      while (true) {
        const command = this.dequeue(userId);
        if (!command) {
          break;
        }

        try {
          await command.execute();
          this.emit('complete', userId, { commandId: command.id });
        } catch (error) {
          this.emit('error', userId, { commandId: command.id, error });
        }
      }
    } finally {
      this.processing.delete(userId);
    }
  }

  on(event: QueueEventType, listener: QueueListener): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  off(event: QueueEventType, listener: QueueListener): void {
    const listeners = this.listeners.get(event) ?? [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: QueueEventType, userId: string, data?: unknown): void {
    const listeners = this.listeners.get(event) ?? [];
    for (const listener of listeners) {
      try {
        listener(userId, data);
      } catch {
        // Defensive: listener errors shouldn't break queue processing
      }
    }
  }
}
