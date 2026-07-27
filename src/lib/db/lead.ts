import { pool } from '../../../db/client.mjs';
import type { Climb } from '../../components/table/types';

export async function getAllLeadClimbs(): Promise<Climb[]> {
  const { rows } = await pool.query(
    `SELECT id, name, grade, tags, media_url AS "mediaUrl", notes, date::text, favorite
     FROM climbing.lead ORDER BY favorite DESC, date DESC`
  );
  return rows;
}
