export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

// Sensitive keys that should never be logged
const SENSITIVE_KEYS = new Set([
  'api_key',
  'apikey',
  'api-key',
  'token',
  'password',
  'secret',
  'authorization',
  'bearer',
  'discORD_TOKEN',
  'llm_api_key',
  'openrouter_api_key',
  'openrouterapikey',
]);

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('key') || lowerKey.includes('secret');
}

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return undefined;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}] [${entry.context}] ${entry.message}`;
  if (entry.data !== undefined) {
    const sanitized = sanitizeData(entry.data);
    if (sanitized !== undefined) {
      return `${base} ${JSON.stringify(sanitized)}`;
    }
  }
  return base;
}

function createLogEntry(
  level: LogLevel,
  context: string,
  message: string,
  data?: unknown,
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    data: data !== undefined ? sanitizeData(data) : undefined,
  };
}

export function log(level: LogLevel, context: string, message: string, data?: unknown): void {
  const entry = createLogEntry(level, context, message, data);
  const formatted = formatLog(entry);

  switch (level) {
    case 'DEBUG':
      console.debug(formatted);
      break;
    case 'INFO':
      console.info(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    case 'ERROR':
      console.error(formatted);
      break;
  }
}

export function debug(context: string, message: string, data?: unknown): void {
  log('DEBUG', context, message, data);
}

export function info(context: string, message: string, data?: unknown): void {
  log('INFO', context, message, data);
}

export function warn(context: string, message: string, data?: unknown): void {
  log('WARN', context, message, data);
}

export function error(context: string, message: string, err?: unknown): void {
  let errorData: unknown = undefined;

  if (err instanceof Error) {
    errorData = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  } else if (err !== undefined) {
    errorData = err;
  }

  log('ERROR', context, message, errorData);
}

class LoggerImpl {
  debug(context: string, message: string, data?: unknown): void {
    log('DEBUG', context, message, data);
  }

  info(context: string, message: string, data?: unknown): void {
    log('INFO', context, message, data);
  }

  warn(context: string, message: string, data?: unknown): void {
    log('WARN', context, message, data);
  }

  error(context: string, message: string, err?: unknown): void {
    let errorData: unknown = undefined;

    if (err instanceof Error) {
      errorData = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else if (err !== undefined) {
      errorData = err;
    }

    log('ERROR', context, message, errorData);
  }
}

export const Logger = new LoggerImpl();
