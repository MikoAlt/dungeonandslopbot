import type { Client } from 'discord.js';
import { Logger } from '../utils/logger.js';

let isShuttingDown = false;

export function setupErrorHandlers(logger: typeof Logger): void {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Process', 'Uncaught exception', err);
    if (!isShuttingDown) {
      isShuttingDown = true;
      gracefulShutdown(1);
    }
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Process', 'Unhandled rejection', reason);
    if (!isShuttingDown) {
      isShuttingDown = true;
      gracefulShutdown(1);
    }
  });
}

export function setupDiscordCloseHandler(client: Client<true>, logger: typeof Logger): void {
  client.on('disconnect', () => {
    logger.warn('Discord', 'Discord WebSocket disconnected');
  });

  client.on('shardDisconnect', (event) => {
    logger.warn('Discord', 'Shard disconnected', { code: event.code, wasClean: event.wasClean });
    logger.info('Discord', 'Attempting to reconnect...');
  });

  client.on('shardReconnecting', () => {
    logger.info('Discord', 'Shard reconnecting');
  });

  client.on('shardResume', () => {
    logger.info('Discord', 'Shard resumed');
  });

  client.on('error', (err) => {
    logger.error('Discord', 'Discord client error', err);
  });
}

async function gracefulShutdown(exitCode: number): Promise<void> {
  Logger.info('Process', 'Initiating graceful shutdown...');

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Logger.info('Process', 'Shutdown complete');
  } catch {
    Logger.error('Process', 'Error during shutdown');
  } finally {
    process.exit(exitCode);
  }
}

export function createShutdownHandler(
  client: Client<true>,
  container: { prisma: { $disconnect: () => Promise<void> } } | null,
  logger: typeof Logger,
): () => Promise<void> {
  return async () => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.info('Process', 'Received shutdown signal, shutting down gracefully...');

    try {
      if (client.isReady()) {
        logger.info('Discord', 'Destroying Discord client');
        client.destroy();
      }

      if (container?.prisma) {
        logger.info('Database', 'Disconnecting Prisma');
        await container.prisma.$disconnect();
      }

      logger.info('Process', 'Graceful shutdown complete');
    } catch (err) {
      logger.error('Process', 'Error during shutdown', err);
    }

    process.exit(0);
  };
}
