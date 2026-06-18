import { describe, expect, it } from 'vitest';
import {
  buildMigrationManifest,
  migrationSources,
  readMigrationSource
} from './migrationManifest.js';

describe('SafeFlow migration manifest', () => {
  it('lists schema before seed data with deterministic source metadata', () => {
    expect(migrationSources).toEqual([
      {
        path: 'database/schema.sql',
        phase: 'schema',
        simulationOnly: true
      },
      {
        path: 'database/seed.sql',
        phase: 'seed',
        simulationOnly: true
      }
    ]);
  });

  it('builds a deterministic checksum manifest for review before migration runs', () => {
    const manifest = buildMigrationManifest();

    expect(manifest).toEqual({
      manifestVersion: 1,
      product: 'SafeFlow',
      simulationOnly: true,
      migrations: [
        expect.objectContaining({
          path: 'database/schema.sql',
          phase: 'schema',
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
          bytes: expect.any(Number)
        }),
        expect.objectContaining({
          path: 'database/seed.sql',
          phase: 'seed',
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
          bytes: expect.any(Number)
        })
      ]
    });
  });

  it('reads migration sources from the repo root and preserves SQL content', () => {
    const source = readMigrationSource('database/schema.sql');

    expect(source).toContain('create table if not exists patient_summaries');
    expect(source).toContain('fictional_scenario boolean not null default true');
  });
});
