# Climbing Tracker — Claude Code context

See [`../CLAUDE.md`](../CLAUDE.md) for cross-app architecture (shared Postgres, shared auth service, deploy pattern) and [`../docs/HOSTING.md`](../docs/HOSTING.md) for server/infra details. This file only covers things specific to this app's code.

## Coding style

- **No one-off CSS**: don't hand-write one-off styles for something a library or plugin already handles well (e.g. typography, animations). Install the proper tool instead.
- **Log errors in API routes**: wrap all I/O in try/catch and `console.error(...)` before returning a 500. Include the route name and operation in the message (e.g. `[api/bouldering] writeFile failed:`). This surfaces errors in server logs (`journalctl -u climbing`) instead of returning a silent 500.

## What this is

A personal climbing log website. The public sees a read-only table and stat views. The owner (you) gets inline editing controls when browsing on localhost or logged in via the shared auth service.

Built with **Astro (SSR, server output)** + **Preact islands** + **Tailwind CSS v4** + **Catppuccin Macchiato** theme. Data lives in Postgres (see `db/`).

## Running the app

```
npm run dev      # http://localhost:4321 — admin mode auto-enabled on localhost
npm run build
npm run preview
```

## Admin mode

This app's concrete implementation of the shared auth pattern described in `../CLAUDE.md`:

- **Localhost**: always admin, no login needed.
- **Deployed**: log in at `auth.lampham.space`. This sets an `access_token`/`refresh_token` cookie pair scoped to `.lampham.space`.
- `src/lib/verifyAccessToken.ts` — shared local JWT verification against `JWT_SECRET` (no DB/network call on the common path); throws at startup if `JWT_SECRET` is unset, so misconfiguration fails loudly instead of silently locking out admin.
- `src/lib/admin.ts` — `isAdmin(request, cookies)` uses the above, plus the localhost bypass.
- `src/middleware.ts` — if the access token is expired but a `refresh_token` cookie is present, makes one server-to-server call to `auth.lampham.space/refresh` to mint (and re-cookie) a new access *and* refresh token pair — both must be re-set, since the auth service rotates/revokes the old refresh token on every use. Otherwise proceeds as anonymous (there's no admin-only-to-*view* page today, so no login redirect is needed).
- `BaseLayout.astro` renders a "Log in"/"Log out" link pointing at the auth service, with `?redirect=` back to the current page.
- `.env.example` shows the required variables (`JWT_SECRET` must match `server-auth`'s). `.env` is gitignored.

## Project structure

```
db/
  client.mjs                # shared pg.Pool, reads DATABASE_URL
  migrate.mjs                # tiny migration runner (schema_migrations table)
  migrations/                # numbered .sql files, applied in order
  import-bouldering.mjs      # one-off: seeds Postgres from src/data/bouldering.json

src/
  data/
    bouldering.json          # legacy — Postgres (climbing.bouldering) is the source of truth now,
                              # kept only as a cold-storage rollback reference, not read/written by the app
    lead.json                 # still JSON-backed — not yet migrated (fast-follow)
    projects.json              # still JSON-backed — not yet migrated (fast-follow)

  lib/
    admin.ts                 # isAdmin(request, cookies) — JWT cookie check, localhost bypass
    verifyAccessToken.ts       # shared JWT verification (used by admin.ts and middleware.ts)
    authOrigin.ts              # AUTH_ORIGIN constant (shared auth service URL)
    db/
      bouldering.ts            # getAllBoulderingClimbs() — the one place the SELECT lives

  middleware.ts               # global Astro middleware — silently refreshes an expired
                               # access token via the auth service when a refresh token is present

  components/
    table/
      types.ts               # Climb interface, GRADES array, PRESET_TAGS, emptyClimb()
      ClimbTable.tsx          # Preact island — state orchestrator (sort, edit, persist)
      ClimbRow.tsx            # read-only table row
      ClimbRowEdit.tsx        # edit/new row (inline form)
      TagInput.tsx            # tag pill editor with datalist suggestions
    views/
      V3PlusProgress.astro   # stat card: progress bar counting V3+ ascents toward a goal
      GradeDistribution.astro # stat card: horizontal bar chart of sends per grade

  pages/
    index.astro              # main page — wires everything together, imports styles
    api/
      bouldering.ts          # GET/POST /api/bouldering — reads/writes climbing.bouldering in Postgres
      lead.ts                 # GET/POST /api/lead — still reads/writes src/data/lead.json
      projects.ts              # POST /api/projects — still reads/writes src/data/projects.json

  styles/
    global.css               # Tailwind v4 entry point + full theme + grade pill CSS
```

## Data model

Each climb in `bouldering.json`:

```ts
interface Climb {
  id: string;       // crypto.randomUUID()
  name: string;
  grade: string;    // V-system: "VB" | "V0" … "V17"
  tags: string[];   // freeform, e.g. ["crimp", "dyno", "heel hook"]
  mediaUrl: string; // optional link (YouTube, Instagram, etc.)
  notes: string;
  date: string;     // YYYY-MM-DD
}
```

## Styling system

- **Tailwind v4** — no `tailwind.config.js`, theme lives in `@theme {}` block in `global.css`.
- **Catppuccin Macchiato** — imported via `@import "@catppuccin/tailwindcss/macchiato.css"`. Activated unconditionally with `class="macchiato"` on `<html>`.
- **Semantic token aliases** in `@theme {}` map generic names to Catppuccin variables. Components use these aliases, not `ctp-*` directly:

| Token | Maps to | Use |
|---|---|---|
| `bg-base` / `text-base` | `ctp-base` | page background |
| `bg-mantle` | `ctp-mantle` | body background |
| `bg-surface` / `bg-surface2` | `ctp-surface0/1` | cards, elevated elements |
| `border-border` | `ctp-surface0` | all borders |
| `text-text` | `ctp-text` | primary text |
| `text-muted` | `ctp-subtext1` | secondary text |
| `text-overlay` | `ctp-overlay1` | disabled/placeholder |
| `bg-accent` / `text-accent` | `ctp-green` | primary accent |
| `bg-accent-h` / `text-accent-h` | `ctp-teal` | hover / secondary accent |
| `text-danger` / `bg-danger` | `ctp-red` | delete, errors |

- **Grade pills** use `.grade--<grade>` classes (e.g. `.grade--V3`). Each sets `--grade-color` as a CSS custom property so both the pill and `GradeDistribution` bars can use the same color.
- Grade color groupings: VB–V2 = blue, V3–V4 = red, V5–V6 = yellow, V7–V8 = peach, V9–V10 = mauve, V11+ = white-on-dark.
- Three shared utility classes in `@layer components`: `.th` (table header), `.td` (table cell), `.field` (text input/select).

## Table features

- **Multi-key sort**: clicking Date or Grade cycles `none → ↓ desc → ↑ asc → none`. Most-recently-clicked column is the primary sort key; previous sorts become tiebreakers. Sort state is client-side only (not persisted).
- **Inline editing**: admin clicks Edit on a row → that row becomes a form. Save POSTs the full array to `/api/bouldering`.
- **Add climb**: "+ Add climb" button appends a new blank row at the bottom in edit mode.
- **Tags**: comma/Enter to add, × to remove, datalist for suggestions from `PRESET_TAGS`.

## Views (stat cards)

Views are Astro components in `src/components/views/`. They receive `climbs: Climb[]` as a prop and render server-side. To add a new view:

1. Create `src/components/views/MyView.astro` accepting `{ climbs: Climb[] }`.
2. Import and drop it into the `<div class="flex flex-wrap gap-4 mb-10">` in `index.astro`.

## Adding a second table (e.g. sport routes)

- **JSON-backed (quick, like `lead.ts`/`projects.ts`)**: create `src/data/routes.json`, duplicate `src/pages/api/lead.ts` → `src/pages/api/routes.ts` and update the `dataPath`, import the data and drop `<ClimbTable dataKey="routes" ... />` on any page. Extend `types.ts` and the row components if you need different columns.
- **Postgres-backed (like `bouldering`)**: add a migration in `db/migrations/`, a `getAllX()` helper in `src/lib/db/`, and a route following `src/pages/api/bouldering.ts`'s pattern (GET selects, POST does a transactional delete+re-insert of the whole array).

## To change the color theme

- **Swap Catppuccin flavor**: change `@import "@catppuccin/tailwindcss/macchiato.css"` to `mocha.css` or `frappe.css`, and update `class="macchiato"` on `<html>` in `index.astro`.
- **Change primary accent color**: update `--color-accent` in the `@theme {}` block of `global.css` to point at a different `ctp-*` variable.
- Both changes are single-line edits.
