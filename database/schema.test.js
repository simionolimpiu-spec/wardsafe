import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(process.cwd(), 'database/schema.sql'), 'utf8');
const seed = readFileSync(resolve(process.cwd(), 'database/seed.sql'), 'utf8');

describe('SafeFlow PostgreSQL schema', () => {
  const requiredTables = [
    'users',
    'wards',
    'patient_summaries',
    'observations',
    'safety_flags',
    'tasks',
    'escalations',
    'handover_items',
    'discharge_blockers',
    'draft_notes',
    'audit_events'
  ];

  it.each(requiredTables)('defines the %s table', (tableName) => {
    expect(schema).toMatch(new RegExp(`create table if not exists ${tableName}\\b`, 'i'));
  });

  it('keeps audit events append-oriented with structured metadata', () => {
    expect(schema).toMatch(/create table if not exists audit_events\b/i);
    expect(schema).toMatch(/event_type text not null/i);
    expect(schema).toMatch(/metadata jsonb not null default '\{\}'::jsonb/i);
    expect(schema).toMatch(/create or replace function prevent_audit_event_mutation\(\)/i);
    expect(schema).toMatch(/create trigger prevent_audit_event_update/i);
    expect(schema).toMatch(/create trigger prevent_audit_event_delete/i);
  });

  it('models clinical workflow relationships with foreign keys', () => {
    const foreignKeyCount = schema.match(/references\s+\w+\s*\(/gi)?.length ?? 0;

    expect(foreignKeyCount).toBeGreaterThanOrEqual(8);
  });

  it('enforces synthetic patient references for the current public scaffold', () => {
    expect(schema).toMatch(/fictional_scenario boolean not null default true check \(fictional_scenario is true\)/i);
    expect(schema).toMatch(/synthetic_patient_ref text not null unique check/i);
    expect(schema).toMatch(/display_label text not null check/i);
  });

  it('keeps trigger creation idempotent for repeated local setup runs', () => {
    const triggerCount = schema.match(/create trigger \w+/gi)?.length ?? 0;
    const dropTriggerCount = schema.match(/drop trigger if exists \w+/gi)?.length ?? 0;

    expect(triggerCount).toBeGreaterThan(0);
    expect(dropTriggerCount).toBe(triggerCount);
  });

  it('avoids direct patient identifiers in the simulation schema and seeds', () => {
    const combined = `${schema}\n${seed}`;

    expect(combined).not.toMatch(/\b(nhs_number|date_of_birth|postcode|address|phone|email)\b/i);
    expect(combined).toMatch(/fictional_scenario boolean not null default true/i);
  });

  it('keeps seed data re-runnable without duplicating active workflow rows', () => {
    const conflictCount = seed.match(/on conflict/gi)?.length ?? 0;

    expect(conflictCount).toBeGreaterThanOrEqual(9);
    expect(seed).toMatch(/where not exists/i);
    expect(seed).not.toMatch(/now\(\)/i);
  });

  it('seeds only fictional SafeFlow discovery data', () => {
    expect(seed).toContain('Day Care Unit');
    expect(seed).toContain('DCU-031');
    expect(seed).toMatch(/fictional/i);
    expect(seed).not.toMatch(/NHS logo|official NHS/i);
  });
});
