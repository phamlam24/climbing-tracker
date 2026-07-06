import type { APIRoute } from 'astro';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isAdmin } from '../../lib/admin';

const dataPath = join(process.cwd(), 'src/data/projects.json');

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

  try {
    await writeFile(dataPath, JSON.stringify(body, null, 2), 'utf-8');
  } catch (e) {
    console.error('[api/projects] writeFile failed:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
  return new Response('OK');
};
