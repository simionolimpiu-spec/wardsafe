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

  it('stores simulation clinical signals without direct identifiers', () => {
    expect(schema).toMatch(/create table if not exists clinical_signals\b/i);
    expect(schema).toContain("synthetic_patient_ref text not null check (synthetic_patient_ref ~ '^DCU-[0-9]{3}$')");
    expect(schema).toContain("source_type text not null check (source_type in ('lab', 'observation', 'microbiology', 'workflow', 'medication', 'allergy', 'sensor', 'external_ai'))");
    expect(schema).toMatch(/simulation_only boolean not null default true check \(simulation_only is true\)/i);
    expect(schema).not.toMatch(/\bnhs_number\b|\bdate_of_birth\b|\bpostcode\b|\baddress\b/i);
  });

  it('stores risk suggestions as nurse-confirmed workflow proposals', () => {
    const seedKeyCount = schema.match(/seed_key text not null unique/g)?.length ?? 0;

    expect(schema).toMatch(/create table if not exists risk_predictions\b/i);
    expect(schema).toMatch(/create table if not exists risk_suggestions\b/i);
    expect(schema).toMatch(/create table if not exists suggestion_actions\b/i);
    expect(schema).toContain("status text not null default 'suggested' check (status in ('suggested', 'accepted', 'dismissed', 'snoozed', 'escalated', 'converted_to_task', 'converted_to_blocker', 'resolved', 'superseded'))");
    expect(schema).toMatch(/requires_human_review boolean not null default true check \(requires_human_review is true\)/i);
    expect(seedKeyCount).toBeGreaterThanOrEqual(2);
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
