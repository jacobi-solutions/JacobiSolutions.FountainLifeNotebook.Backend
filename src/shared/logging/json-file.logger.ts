import type { LoggerService, LogLevel } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

const DEFAULT_APPLICATION_NAME = 'FountainLifeNotebook.Backend';
const DEFAULT_LOG_DIRECTORY = 'var/logs';
const DEFAULT_LOG_FILE_NAME = 'backend-%DATE%.log';
const DEFAULT_MINIMUM_LEVEL: MinimumLogLevel = 'Information';

const LOG_LEVEL_ORDER: Record<NestLogLevel, number> = {
  Fatal: 0,
  Error: 1,
  Warning: 2,
  Information: 3,
  Debug: 4,
  Verbose: 5,
};

const NEST_TO_MINIMUM_LEVEL: Record<NestLogMethod, MinimumLogLevel> = {
  debug: 'Debug',
  error: 'Error',
  fatal: 'Fatal',
  log: 'Information',
  verbose: 'Verbose',
  warn: 'Warning',
};

const LOG_LEVEL_ALIASES: Record<string, MinimumLogLevel> = {
  critical: 'Fatal',
  debug: 'Debug',
  error: 'Error',
  fatal: 'Fatal',
  information: 'Information',
  info: 'Information',
  log: 'Information',
  trace: 'Verbose',
  verbose: 'Verbose',
  warn: 'Warning',
  warning: 'Warning',
};

type NestLogMethod = Extract<
  LogLevel,
  'debug' | 'error' | 'fatal' | 'log' | 'verbose' | 'warn'
>;
export type MinimumLogLevel =
  | 'Debug'
  | 'Error'
  | 'Fatal'
  | 'Information'
  | 'Verbose'
  | 'Warning';
type NestLogLevel = MinimumLogLevel;

interface JsonFileLoggerOptions {
  applicationName: string;
  environment: string;
  fileName: string;
  logDirectory: string;
  minimumLevel: MinimumLogLevel;
  now?: () => Date;
  stderr?: (line: string) => void;
  stdout?: (line: string) => void;
}

type LogPayload = Record<string, unknown>;

export class JsonFileLogger implements LoggerService {
  private readonly logDirectory: string;
  private readonly now: () => Date;
  private readonly stderr: (line: string) => void;
  private readonly stdout: (line: string) => void;

  constructor(private readonly options: JsonFileLoggerOptions) {
    this.logDirectory = isAbsolute(options.logDirectory)
      ? options.logDirectory
      : resolve(options.logDirectory);

    mkdirSync(this.logDirectory, { recursive: true });
    this.now = options.now ?? (() => new Date());
    this.stderr =
      options.stderr ?? ((line) => process.stderr.write(`${line}\n`));
    this.stdout =
      options.stdout ?? ((line) => process.stdout.write(`${line}\n`));
  }

  log(message: unknown, context?: string) {
    this.write('log', message, undefined, context);
  }

  error(message: unknown, stackOrContext?: string, context?: string) {
    const stack = context ? stackOrContext : undefined;
    const resolvedContext = context ?? stackOrContext;

    this.write('error', message, stack, resolvedContext);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, undefined, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, undefined, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, undefined, context);
  }

  fatal(message: unknown, context?: string) {
    this.write('fatal', message, undefined, context);
  }

  private write(
    method: NestLogMethod,
    message: unknown,
    stack?: string,
    context?: string,
  ) {
    const level = NEST_TO_MINIMUM_LEVEL[method];
    if (!this.isEnabled(level)) {
      return;
    }
    const timestamp = this.now();

    const line = stringifyLogEntry({
      ...this.createBasePayload(level, timestamp, message, context, stack),
      ...extractPayload(message),
    });

    appendFileSync(this.readLogFilePath(timestamp), `${line}\n`, 'utf8');

    if (method === 'error' || method === 'fatal') {
      this.stderr(line);
      return;
    }

    this.stdout(line);
  }

  private createBasePayload(
    level: NestLogLevel,
    timestamp: Date,
    message: unknown,
    context?: string,
    stack?: string,
  ): LogPayload {
    return {
      application: this.options.applicationName,
      context,
      environment: this.options.environment,
      level,
      message: readMessageText(message),
      stack,
      timestamp: timestamp.toISOString(),
    };
  }

  private isEnabled(level: NestLogLevel) {
    return LOG_LEVEL_ORDER[level] <= LOG_LEVEL_ORDER[this.options.minimumLevel];
  }

  private readLogFilePath(timestamp: Date) {
    const dateStamp = timestamp.toISOString().slice(0, 10);
    return join(
      this.logDirectory,
      this.options.fileName.replaceAll('%DATE%', dateStamp),
    );
  }
}

export function createJsonFileLoggerFromEnvironment(
  env: NodeJS.ProcessEnv = process.env,
) {
  return new JsonFileLogger({
    applicationName: env.LOG_APPLICATION_NAME ?? DEFAULT_APPLICATION_NAME,
    environment: env.APP_ENV ?? 'local',
    fileName: env.LOG_FILE_NAME ?? DEFAULT_LOG_FILE_NAME,
    logDirectory: env.LOG_DIRECTORY ?? DEFAULT_LOG_DIRECTORY,
    minimumLevel: normalizeMinimumLogLevel(env.LOG_LEVEL),
  });
}

export function normalizeMinimumLogLevel(value: unknown): MinimumLogLevel {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_MINIMUM_LEVEL;
  }

  if (typeof value !== 'string') {
    throw new Error(
      `LOG_LEVEL must be one of: ${Object.values(LOG_LEVEL_ALIASES).join(', ')}`,
    );
  }

  const normalized = LOG_LEVEL_ALIASES[value.trim().toLowerCase()];
  if (!normalized) {
    throw new Error(
      `LOG_LEVEL must be one of: ${Object.values(LOG_LEVEL_ALIASES).join(', ')}`,
    );
  }

  return normalized;
}

function readMessageText(message: unknown) {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.message;
  }

  if (isPlainRecord(message)) {
    const candidate = message.message ?? message.event;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  return 'Log event';
}

function extractPayload(message: unknown): LogPayload {
  if (message instanceof Error) {
    return {
      errorName: message.name,
      errorStack: message.stack,
    };
  }

  if (!isPlainRecord(message)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(message).filter(
      ([key]) =>
        ![
          'application',
          'context',
          'environment',
          'level',
          'stack',
          'timestamp',
        ].includes(key),
    ),
  );
}

function isPlainRecord(value: unknown): value is LogPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyLogEntry(payload: LogPayload) {
  const seen = new WeakSet<object>();

  return JSON.stringify(payload, (_key, value: unknown) => {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);
    return value;
  });
}
