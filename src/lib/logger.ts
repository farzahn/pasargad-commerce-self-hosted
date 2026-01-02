/**
 * Structured Logging Utility
 *
 * Provides consistent, structured logging across the application.
 * Supports different log levels and optional context data.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  /** Operation or action being performed */
  operation?: string;
  /** User ID if available */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional context data */
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Log level priority for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get the minimum log level from environment
 */
function getMinLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (level && LOG_LEVELS[level] !== undefined) {
    return level;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

/**
 * Format an error for logging
 */
function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error !== undefined) {
    entry.error = formatError(error);
  }

  return entry;
}

/**
 * Output a log entry
 */
function outputLog(entry: LogEntry): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Pretty print in development
    const prefix = `[${entry.level.toUpperCase()}]`;
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}${contextStr}`);
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  } else {
    // JSON output in production (for log aggregators)
    console.log(JSON.stringify(entry));
  }
}

/**
 * Logger instance with context
 */
class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;
    const entry = createLogEntry('debug', message, { ...this.context, ...context });
    outputLog(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;
    const entry = createLogEntry('info', message, { ...this.context, ...context });
    outputLog(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext, error?: unknown): void {
    if (!shouldLog('warn')) return;
    const entry = createLogEntry('warn', message, { ...this.context, ...context }, error);
    outputLog(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (!shouldLog('error')) return;
    const entry = createLogEntry('error', message, { ...this.context, ...context }, error);
    outputLog(entry);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with a specific context
 */
export function createLogger(context: LogContext): Logger {
  return new Logger(context);
}

/**
 * Pre-configured loggers for specific domains
 */
export const loggers = {
  /** Logger for authentication operations */
  auth: createLogger({ domain: 'auth' }),
  /** Logger for order operations */
  orders: createLogger({ domain: 'orders' }),
  /** Logger for product operations */
  products: createLogger({ domain: 'products' }),
  /** Logger for API operations */
  api: createLogger({ domain: 'api' }),
  /** Logger for PocketBase operations */
  pocketbase: createLogger({ domain: 'pocketbase' }),
} as const;

export { Logger };
