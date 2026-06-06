import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isAdmin } from '../../lib/admin';

const dataPath = join(process.cwd(), 'src/data/bouldering.json');

export const GET: APIRoute = async () => {
  const data = await readFile(dataPath, 'utf-8');
  return new Response(data, { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) {
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

  try {
    await writeFile(dataPath, JSON.stringify(body, null, 2), 'utf-8');
  } catch (e) {
    console.error('[api/bouldering] writeFile failed:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
  return new Response('OK');
};
