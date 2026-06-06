import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonFileLogger, normalizeMinimumLogLevel } from './json-file.logger';

describe('JsonFileLogger', () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('writes structured JSON lines to console and the backend log file', () => {
    const root = createTempRoot();
    const consoleLines: string[] = [];
    const logger = new JsonFileLogger({
      applicationName: 'TestApi',
      environment: 'test',
      fileName: 'backend-%DATE%.log',
      logDirectory: root,
      minimumLevel: 'Information',
      now: () => new Date('2026-06-06T16:00:00.000Z'),
      stdout: (line) => consoleLines.push(line),
    });

    logger.log(
      {
        correlationId: 'correlation-1',
        event: 'request.completed',
        method: 'GET',
        path: '/api/health',
      },
      'RequestResponseLoggingInterceptor',
    );

    const logLine = readFileSync(
      join(root, 'backend-2026-06-06.log'),
      'utf8',
    ).trim();
    const entry = JSON.parse(logLine) as Record<string, unknown>;

    expect(consoleLines).toEqual([logLine]);
    expect(entry).toMatchObject({
      application: 'TestApi',
      context: 'RequestResponseLoggingInterceptor',
      correlationId: 'correlation-1',
      environment: 'test',
      event: 'request.completed',
      level: 'Information',
      message: 'request.completed',
      method: 'GET',
      path: '/api/health',
    });
    expect(entry.timestamp).toBe('2026-06-06T16:00:00.000Z');
  });

  it('rolls log files by entry date when the filename contains the date token', () => {
    const root = createTempRoot();
    const timestamps = [
      new Date('2026-06-06T23:59:59.000Z'),
      new Date('2026-06-07T00:00:00.000Z'),
    ];
    const logger = new JsonFileLogger({
      applicationName: 'TestApi',
      environment: 'test',
      fileName: 'backend-%DATE%.log',
      logDirectory: root,
      minimumLevel: 'Information',
      now: () => timestamps.shift() ?? new Date('2026-06-07T00:00:00.000Z'),
      stdout: noop,
    });

    logger.log('before midnight');
    logger.log('after midnight');

    expect(
      readFileSync(join(root, 'backend-2026-06-06.log'), 'utf8'),
    ).toContain('before midnight');
    expect(
      readFileSync(join(root, 'backend-2026-06-07.log'), 'utf8'),
    ).toContain('after midnight');
  });

  it('supports fixed log file names when the date token is omitted', () => {
    const root = createTempRoot();
    const logger = new JsonFileLogger({
      applicationName: 'TestApi',
      environment: 'test',
      fileName: 'backend.log',
      logDirectory: root,
      minimumLevel: 'Information',
      now: () => new Date('2026-06-06T16:00:00.000Z'),
      stdout: noop,
    });

    logger.log('fixed file');

    expect(readFileSync(join(root, 'backend.log'), 'utf8')).toContain(
      'fixed file',
    );
  });

  it('writes errors to stderr and includes stack details', () => {
    const root = createTempRoot();
    const errorLines: string[] = [];
    const logger = new JsonFileLogger({
      applicationName: 'TestApi',
      environment: 'test',
      fileName: 'backend.log',
      logDirectory: root,
      minimumLevel: 'Information',
      now: () => new Date('2026-06-06T16:00:00.000Z'),
      stderr: (line) => errorLines.push(line),
    });

    logger.error('Mongo connection failed', 'stack trace', 'MongooseModule');

    const logLine = readFileSync(join(root, 'backend.log'), 'utf8').trim();
    const entry = JSON.parse(logLine) as Record<string, unknown>;

    expect(errorLines).toEqual([logLine]);
    expect(entry).toMatchObject({
      context: 'MongooseModule',
      level: 'Error',
      message: 'Mongo connection failed',
      stack: 'stack trace',
    });
  });

  it('filters lower-priority messages below the configured minimum level', () => {
    const root = createTempRoot();
    const logger = new JsonFileLogger({
      applicationName: 'TestApi',
      environment: 'test',
      fileName: 'backend.log',
      logDirectory: root,
      minimumLevel: 'Warning',
      now: () => new Date('2026-06-06T16:00:00.000Z'),
      stdout: noop,
    });

    logger.log('startup complete');
    logger.debug('debug detail');

    expect(existsSync(join(root, 'backend.log'))).toBe(false);
  });

  it('accepts dotnet-style and node-style log level names', () => {
    expect(normalizeMinimumLogLevel('Information')).toBe('Information');
    expect(normalizeMinimumLogLevel('info')).toBe('Information');
    expect(normalizeMinimumLogLevel('Warning')).toBe('Warning');
    expect(normalizeMinimumLogLevel('warn')).toBe('Warning');
  });

  function createTempRoot() {
    const root = mkdtempSync(join(tmpdir(), 'fountain-life-logs-'));
    tempRoots.push(root);
    return root;
  }

  function noop() {
    return undefined;
  }
});
