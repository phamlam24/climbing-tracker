import type { APIRoute } from 'astro';
import { isAdmin } from '../../lib/admin';
import { getAllLeadClimbs } from '../../lib/db/lead';
import { pool } from '../../../db/client.mjs';
import type { Climb } from '../../components/table/types';

export const GET: APIRoute = async () => {
  try {
    const climbs = await getAllLeadClimbs();
    return new Response(JSON.stringify(climbs), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[api/lead] query failed:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!(await isAdmin(request, cookies))) {
    return new Response('Forbidden', { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!Array.isArray(body)) {
    return new Response('Expected an array', { status: 400 });
  }

  const climbs = body as Climb[];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM climbing.lead');
    for (const c of climbs) {
      await client.query(
        `INSERT INTO climbing.lead (id, name, grade, tags, media_url, notes, date, favorite)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [c.id, c.name, c.grade, c.tags, c.mediaUrl, c.notes, c.date, !!c.favorite]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[api/lead] transaction failed:', e);
    return new Response('Internal Server Error', { status: 500 });
  } finally {
    client.release();
  }

  return new Response('OK');
};
