const keywords = ['type', 'required', 'properties', 'additionalProperties', 'enum', 'items', 'minLength', 'pattern', 'minimum', 'maximum'];
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const matchesType = (type, value) => type === 'object' ? plain(value) : type === 'array' ? Array.isArray(value)
  : typeof value === type && (type !== 'number' || Number.isFinite(value));
function sameValue(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
  return Object.keys(left).length === Object.keys(right).length
    && Object.keys(left).every((key) => Object.hasOwn(right, key) && sameValue(left[key], right[key]));
}

export function assertSupportedSchema(schema, ancestors = new Set()) {
  if (!plain(schema) || ancestors.has(schema)) throw new TypeError('Invalid tool schema.');
  if (Object.keys(schema).some((key) => !keywords.includes(key))) throw new TypeError('Unsupported schema keyword.');
  if (!['object', 'array', 'string', 'number', 'boolean'].includes(schema.type)) throw new TypeError('Unsupported schema type.');
  const allowed = { object: ['required', 'properties', 'additionalProperties'], array: ['items'], string: ['minLength', 'pattern'], number: ['minimum', 'maximum'], boolean: [] };
  if (Object.keys(schema).some((key) => !['type', 'enum', ...allowed[schema.type]].includes(key))) throw new TypeError('Schema keyword does not match type.');
  if ('enum' in schema && (!Array.isArray(schema.enum) || !schema.enum.length
    || schema.enum.some((value) => !matchesType(schema.type, value)))) throw new TypeError('Invalid schema enum.');
  const next = new Set(ancestors).add(schema);
  if ('properties' in schema) {
    if (!plain(schema.properties)) throw new TypeError('Invalid schema properties.');
    Object.values(schema.properties).forEach((child) => assertSupportedSchema(child, next));
  }
  if ('required' in schema && (!Array.isArray(schema.required) || schema.required.some((key) => typeof key !== 'string' || !Object.hasOwn(schema.properties ?? {}, key)))) throw new TypeError('Invalid required properties.');
  if ('additionalProperties' in schema && schema.additionalProperties !== false) throw new TypeError('Only closed additional properties are supported.');
  if ('items' in schema) assertSupportedSchema(schema.items, next);
  if ('minLength' in schema && (!Number.isSafeInteger(schema.minLength) || schema.minLength < 0)) throw new TypeError('Invalid minimum length.');
  if ('pattern' in schema) {
    if (typeof schema.pattern !== 'string') throw new TypeError('Invalid schema pattern.');
    new RegExp(schema.pattern);
  }
  for (const key of ['minimum', 'maximum']) if (key in schema && !Number.isFinite(schema[key])) throw new TypeError('Invalid numeric bound.');
  if (schema.minimum > schema.maximum) throw new TypeError('Reversed numeric bounds.');
}

export function validateAgainstSchema(schema, value) {
  assertSupportedSchema(schema);
  const errors = [];
  function visit(rule, item, path) {
    const matches = matchesType(rule.type, item);
    if (!matches) { errors.push(`${path}: expected ${rule.type}`); return; }
    if (rule.enum && !rule.enum.some((value) => sameValue(value, item))) errors.push(`${path}: invalid enum value`);
    if (rule.type === 'object') {
      for (const key of rule.required ?? []) if (!Object.hasOwn(item, key)) errors.push(`${path}.${key}: required`);
      for (const key of Object.keys(item)) {
        if (Object.hasOwn(rule.properties ?? {}, key)) visit(rule.properties[key], item[key], `${path}.${key}`);
        else if (rule.additionalProperties === false) errors.push(`${path}.${key}: extra property`);
      }
    }
    if (rule.type === 'array' && rule.items) for (let index = 0; index < item.length; index++) visit(rule.items, item[index], `${path}[${index}]`);
    if (rule.type === 'string' && (item.length < (rule.minLength ?? 0) || (rule.pattern !== undefined && !new RegExp(rule.pattern).test(item)))) errors.push(`${path}: invalid string`);
    if (rule.type === 'number' && (item < rule.minimum || item > rule.maximum)) errors.push(`${path}: outside bounds`);
  }
  visit(schema, value, '$');
  return { valid: errors.length === 0, errors };
}
