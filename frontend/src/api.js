import { defaultTimetable } from '../../shared/timetable.js';

import { request } from './senior-api.js';
export { request };

export async function fetchTimetable() {
  try {
    const entries = await request('/timetable');
    return Array.isArray(entries) && entries.length ? entries : defaultTimetable;
  } catch {
    return defaultTimetable;
  }
}

export function formatPostDate(value) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}
