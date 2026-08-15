#!/usr/bin/env node
/**
 * validate-case-corpus.mjs
 *
 * Validates data/public-case-corpus/{cases,excluded}/*.json against
 * data/public-case-corpus/schema.json.
 *
 * Zero dependencies, deliberately. Adding ajv to package.json for a
 * corpus-integrity check would drag a package-manager change into an
 * otherwise self-contained data subsystem, which AGENTS.md tells us not
 * to do. This implements only the JSON Schema draft-07 keywords the
 * corpus schema actually uses, and FAILS LOUDLY on any keyword it does
 * not recognise rather than silently passing a rule it cannot enforce —
 * a validator that quietly ignores a constraint is worse than none.
 *
 * Supported: type, enum, const, required, properties, additionalProperties,
 *            items, minItems, minimum, pattern, format (date | uri)
 * Ignored (annotations only): $schema, $id, title, description, default
 *
 * Excluded records are validated with `contacts.minItems` relaxed to 0:
 * a case excluded on C1 by definition has fewer than two contacts, so the
 * included-case rule cannot apply to it. Every other rule still applies.
 *
 * Usage:
 *   node scripts/validate-case-corpus.mjs
 *   node scripts/validate-case-corpus.mjs --quiet   # only failures
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CORPUS = path.join(ROOT, 'data', 'public-case-corpus');

const ANNOTATIONS = new Set([
  '$schema', '$id', 'title', 'description', 'default', 'examples', 'comment',
]);
const SUPPORTED = new Set([
  'type', 'enum', 'const', 'required', 'properties', 'additionalProperties',
  'items', 'minItems', 'minimum', 'pattern', 'format',
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const typeOf = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v; // string | number | boolean | object
};

const matchesType = (value, expected) => {
  const actual = typeOf(value);
  if (expected === 'number') return actual === 'number' || actual === 'integer';
  return actual === expected;
};

/** Deep-equality sufficient for enum members (primitives and null only here). */
const enumMatches = (value, members) =>
  members.some((m) => m === value || (m === null && value === null));

function validate(schema, value, at, errors) {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED.has(key) && !ANNOTATIONS.has(key)) {
      throw new Error(
        `schema uses unsupported keyword "${key}" at ${at || '<root>'} — ` +
          `extend validate-case-corpus.mjs rather than letting it pass unchecked`
      );
    }
  }

  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((t) => matchesType(value, t))) {
      errors.push(`${at}: expected type ${allowed.join('|')}, got ${typeOf(value)}`);
      return; // further checks are meaningless on the wrong type
    }
  }

  if (schema.enum !== undefined && !enumMatches(value, schema.enum)) {
    errors.push(
      `${at}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`
    );
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${at}: expected const ${JSON.stringify(schema.const)}`);
  }

  if (typeof value === 'string') {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${at}: "${value}" does not match /${schema.pattern}/`);
    }
    if (schema.format === 'date' && !DATE_RE.test(value)) {
      errors.push(`${at}: "${value}" is not a YYYY-MM-DD date`);
    }
    if (schema.format === 'uri') {
      try {
        new URL(value);
      } catch {
        errors.push(`${at}: "${value}" is not a valid URI`);
      }
    }
  }

  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${at}: ${value} is below minimum ${schema.minimum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${at}: has ${value.length} items, minimum ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((item, i) => validate(schema.items, item, `${at}[${i}]`, errors));
    }
  }

  if (value !== null && typeOf(value) === 'object') {
    for (const req of schema.required || []) {
      if (!(req in value)) errors.push(`${at}: missing required property "${req}"`);
    }
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      const child = at ? `${at}.${k}` : k;
      if (props[k]) validate(props[k], v, child, errors);
      else if (schema.additionalProperties === false) {
        errors.push(`${child}: property not permitted by schema`);
      }
    }
  }
}

/** Deep clone with contacts.minItems relaxed, for the excluded register. */
function relaxContactsMinItems(schema) {
  const copy = structuredClone(schema);
  if (copy.properties?.contacts?.minItems !== undefined) {
    copy.properties.contacts.minItems = 0;
  }
  return copy;
}

async function validateDir(dir, schema, label, quiet) {
  const full = path.join(CORPUS, dir);
  let files;
  try {
    files = (await readdir(full)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    console.log(`${label}: directory not present, skipped`);
    return { passed: 0, failed: 0 };
  }

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const rel = `${dir}/${file}`;
    let data;
    try {
      data = JSON.parse(await readFile(path.join(full, file), 'utf8'));
    } catch (err) {
      console.error(`  FAIL ${rel}\n         not valid JSON: ${err.message}`);
      failed++;
      continue;
    }

    const errors = [];
    validate(schema, data, '', errors);

    // Filename must match the record's own id, or cross-references in the
    // manifest and verification log silently point at the wrong record.
    const expectedId = file.replace(/\.json$/, '');
    if (data.id !== expectedId) {
      errors.push(`id: "${data.id}" does not match filename "${expectedId}"`);
    }

    if (errors.length) {
      console.error(`  FAIL ${rel}`);
      for (const e of errors) console.error(`         ${e}`);
      failed++;
    } else {
      if (!quiet) console.log(`  ok   ${rel}`);
      passed++;
    }
  }

  return { passed, failed };
}

async function main() {
  const quiet = process.argv.includes('--quiet');
  const schema = JSON.parse(await readFile(path.join(CORPUS, 'schema.json'), 'utf8'));

  console.log(`schema: ${schema.$id} (${schema.$schema})\n`);

  console.log('cases/ (strict)');
  const inc = await validateDir('cases', schema, 'cases', quiet);

  console.log('\nexcluded/ (contacts.minItems relaxed to 0)');
  const exc = await validateDir('excluded', relaxContactsMinItems(schema), 'excluded', quiet);

  const passed = inc.passed + exc.passed;
  const failed = inc.failed + exc.failed;
  console.log(`\n${passed} valid, ${failed} invalid (${passed + failed} records)`);

  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
