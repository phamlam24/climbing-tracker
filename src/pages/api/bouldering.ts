import type { APIRoute } from 'astro';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { isAdmin } from '../../lib/admin';

const dataPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../data/bouldering.json'
);

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

  await writeFile(dataPath, JSON.stringify(body, null, 2), 'utf-8');
  return new Response('OK');
};
