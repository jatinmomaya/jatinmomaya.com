// Build-time only: reads the trip files. Never import this from a client component.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { summarize, type Trip, type TripSummary } from './trips';

const DIR = path.join(process.cwd(), 'src', 'data', 'trips');

/** Every trip, newest first. Adding a trip is adding a file; nothing else to register. */
export function getTrips(): Trip[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(DIR, f), 'utf8')) as Trip)
    .filter((t) => t.photos.length > 0)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
}

export function getTripSummaries(): TripSummary[] {
  return getTrips().map(summarize);
}
