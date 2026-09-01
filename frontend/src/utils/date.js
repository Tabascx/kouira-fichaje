// Small timezone helpers using Intl.DateTimeFormat to avoid adding deps

export function toUTCISOString(input) {
  const d = input ? new Date(input) : new Date();
  return d.toISOString();
}

export function formatInTimezone(input, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone, options = {}) {
  const d = input ? new Date(input) : new Date();
  const df = new Intl.DateTimeFormat('default', { timeZone, ...options });
  return df.format(d);
}

export function localToUTCDateString(localDate) {
  // Input like '2026-09-01' -> returns '2026-09-01' in UTC (date portion)
  const d = new Date(localDate + 'T00:00:00');
  return d.toISOString().split('T')[0];
}
