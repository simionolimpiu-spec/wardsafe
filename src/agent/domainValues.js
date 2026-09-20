// Copy plain data before freezing so callers retain ownership of their inputs.
export function frozenCopy(value, seen = new Map()) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function') throw new TypeError('Expected plain simulation data.');
    return value;
  }
  if (seen.has(value)) return seen.get(value);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null) {
    throw new TypeError('Expected plain simulation data.');
  }
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    Object.defineProperty(copy, key, {
      value: frozenCopy(value[key], seen), enumerable: true
    });
  }
  return Object.freeze(copy);
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isIsoTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, offsetHour = '0', offsetMinute = '0'] = match;
  const leapYear = +year % 4 === 0 && (+year % 100 !== 0 || +year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return +month >= 1 && +month <= 12 && +day >= 1 && +day <= days[+month - 1]
    && +hour < 24 && +minute < 60 && +second < 60
    && +offsetHour < 24 && +offsetMinute < 60 && Number.isFinite(Date.parse(value));
}

export function timestampFrom(now) {
  const timestamp = now();
  if (!isIsoTimestamp(timestamp)) throw new TypeError('Clock must return an ISO simulation timestamp.');
  return timestamp;
}
