import { pool } from '../../../db/client.mjs';
import type { Climb } from '../../components/table/types';

export async function getAllBoulderingClimbs(): Promise<Climb[]> {
  const { rows } = await pool.query(
    `SELECT id, name, grade, tags, media_url AS "mediaUrl", notes, date::text
     FROM climbing.bouldering ORDER BY date DESC`
  );
  return rows;
}
