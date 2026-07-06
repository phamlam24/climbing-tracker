# Climbing Tracker

Rudimentary, vibed in like 1.5 hours.

## Local development

1. Install Postgres locally and create a dev-only database:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE lampham_dev;"
   ```
   (Or run one in a throwaway container: `docker run -d --name lampham-dev -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=lampham_dev -p 5432:5432 postgres:16`.)
2. Copy `.env.example` to `.env` and point `DATABASE_URL` at that dev database.
3. `npm run migrate` — creates the `climbing` schema and tables.
4. `npm run import-bouldering` — one-time seed of `src/data/bouldering.json` into Postgres (safe to re-run against a fresh dev DB; it doesn't touch prod).
5. `npm run dev` — reads/writes Postgres from here on.