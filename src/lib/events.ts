import type { PoolClient } from 'pg';

/**
 * Inserts into the shared events.events table (see docs/EVENTS.md) using the
 * caller's own client/transaction, so the event commits atomically with
 * whatever it describes.
 */
export async function emitEvent(client: PoolClient, type: string, payload: Record<string, unknown>) {
  await client.query('INSERT INTO events.events (type, source_app, payload) VALUES ($1, $2, $3)', [
    type,
    'climbing',
    JSON.stringify(payload)
  ]);
}
