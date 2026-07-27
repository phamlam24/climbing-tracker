import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './client.mjs';

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'lead.json');

async function main() {
  const climbs = JSON.parse(await readFile(dataPath, 'utf-8'));

  for (const c of climbs) {
    await pool.query(
      `INSERT INTO climbing.lead (name, grade, tags, media_url, notes, date, favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [c.name, c.grade, c.tags, c.mediaUrl, c.notes, c.date, !!c.favorite]
    );
  }

  await pool.end();
  console.log(`Imported ${climbs.length} rows.`);
}

main();
