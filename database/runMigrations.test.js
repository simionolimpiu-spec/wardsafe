import { describe, expect, it, vi } from 'vitest';
import { createMigrationCli, isCliEntryPoint, redactSensitiveText } from './runMigrations.js';

describe('SafeFlow migration CLI', () => {
  it('detects the CLI entrypoint from a Windows argv path', () => {
    expect(isCliEntryPoint(
      'file:///C:/Users/oli/Documents/wardsafe/database/runMigrations.js',
      'C:\\Users\\oli\\Documents\\wardsafe\\database\\runMigrations.js'
    )).toBe(true);
  });

  it('detects the CLI entrypoint from a POSIX argv path on any host OS', () => {
    expect(isCliEntryPoint(
      'file:///home/runner/work/wardsafe/wardsafe/database/runMigrations.js',
      '/home/runner/work/wardsafe/wardsafe/database/runMigrations.js'
    )).toBe(true);
  });

  it('plans before constructing or connecting a database client in execute mode', async () => {
    const clientFactory = vi.fn();
    const planMigrationRun = vi.fn(() => {
      throw new Error('Set SAFEFLOW_SIMULATION_ONLY=true before planning or running SafeFlow migrations.');
    });
    const cli = createMigrationCli({
      clientFactory,
      loadMigrationApproval: vi.fn(() => ({ approved: true })),
      planMigrationRun,
      runMigration: vi.fn(),
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      env: {
        DATABASE_URL: 'postgres://user:secret@example.test:5432/safeflow',
        SAFEFLOW_MIGRATION_APPROVED: 'true'
      }
    });

    const exitCode = await cli(['--execute']);

    expect(exitCode).toBe(1);
    expect(planMigrationRun).toHaveBeenCalledWith({
      approval: { approved: true },
      mode: 'execute'
    });
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it('redacts credential-bearing URLs before writing errors', () => {
    expect(redactSensitiveText('failed postgres://user:secret@example.test/db')).toBe(
      'failed postgres://[redacted]@example.test/db'
    );
    expect(redactSensitiveText('failed postgresql://user:secret@example.test/db')).toBe(
      'failed postgresql://[redacted]@example.test/db'
    );
  });

  it('does not print raw database credentials when CLI execution fails', async () => {
    const stderr = { write: vi.fn() };
    const cli = createMigrationCli({
      clientFactory: vi.fn(),
      loadMigrationApproval: vi.fn(() => ({ approved: true })),
      planMigrationRun: vi.fn(() => {
        throw new Error('failed postgres://user:secret@example.test:5432/safeflow');
      }),
      runMigration: vi.fn(),
      stdout: { write: vi.fn() },
      stderr,
      env: {
        DATABASE_URL: 'postgres://user:secret@example.test:5432/safeflow',
        SAFEFLOW_MIGRATION_APPROVED: 'true'
      }
    });

    await cli(['--execute']);

    expect(stderr.write).toHaveBeenCalledWith('failed postgres://[redacted]@example.test:5432/safeflow\n');
  });
});
