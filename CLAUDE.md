# Climbing Tracker — Claude Code context

## Coding style

- **No one-off CSS**: don't hand-write one-off styles for something a library or plugin already handles well (e.g. typography, animations). Install the proper tool instead.

## What this is

A personal climbing log website. The public sees a read-only table and stat views. The owner (you) gets inline editing controls when browsing on localhost or with a secret URL token.

Built with **Astro (SSR, server output)** + **Preact islands** + **Tailwind CSS v4** + **Catppuccin Macchiato** theme. Data is plain JSON files on disk — no database, no auth system.

## Running the app

```
npm run dev      # http://localhost:4321 — admin mode auto-enabled on localhost
npm run build
npm run preview
```

## Admin mode

- **Localhost**: always admin, no token needed.
- **Deployed**: visit `/?admin=<ADMIN_TOKEN>` where the token is set in `.env`.
- `.env.example` shows the required variable. `.env` is gitignored.
- Logic lives in `src/lib/admin.ts` — `isAdmin(request)` is called at the top of every page that needs it.

## Project structure

```
src/
  data/
    bouldering.json          # climb records — source of truth, edited via UI or directly

  lib/
    admin.ts                 # isAdmin() helper

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
      bouldering.ts          # POST /api/bouldering — writes the JSON file back to disk

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

1. Create `src/data/routes.json` with the same schema (or a new one).
2. Duplicate `src/pages/api/bouldering.ts` → `src/pages/api/routes.ts`, update the `dataPath`.
3. Import the data and drop `<ClimbTable dataKey="routes" ... />` on any page.
4. If you need different columns, extend `types.ts` and the row components.

## To change the color theme

- **Swap Catppuccin flavor**: change `@import "@catppuccin/tailwindcss/macchiato.css"` to `mocha.css` or `frappe.css`, and update `class="macchiato"` on `<html>` in `index.astro`.
- **Change primary accent color**: update `--color-accent` in the `@theme {}` block of `global.css` to point at a different `ctp-*` variable.
- Both changes are single-line edits.
