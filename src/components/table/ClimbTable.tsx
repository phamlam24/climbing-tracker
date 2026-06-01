import { useState } from 'preact/hooks';
import ClimbRow from './ClimbRow';
import ClimbRowEdit from './ClimbRowEdit';
import { emptyClimb, GRADES } from './types';
import type { Climb } from './types';

interface Props {
  initialClimbs: Climb[];
  isAdmin: boolean;
  dataKey: string;
}

// ── Sort state ────────────────────────────────────────────────
type SortKey = 'date' | 'grade';
type SortDir = 'asc' | 'desc';
type SortEntry = { key: SortKey; dir: SortDir };

// Cycle: none → desc → asc → none
function cycleDir(current: SortDir | null): SortDir | null {
  if (current === null) return 'desc';
  if (current === 'desc') return 'asc';
  return null;
}

function applySorts(climbs: Climb[], sorts: SortEntry[]): Climb[] {
  if (!sorts.length) return climbs;
  return [...climbs].sort((a, b) => {
    for (const { key, dir } of sorts) {
      let cmp = 0;
      if (key === 'date') {
        cmp = a.date.localeCompare(b.date);
      } else if (key === 'grade') {
        cmp = GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
      }
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

// ── Sort header button ────────────────────────────────────────
function SortHeader({ label, dir, onClick }: {
  label: string;
  dir: SortDir | null;
  onClick: () => void;
}) {
  const indicator = dir === 'desc' ? '↓' : dir === 'asc' ? '↑' : '↕';
  const active = dir !== null;
  return (
    <button
      class={`flex items-center gap-1 transition-colors hover:text-text ${active ? 'text-text' : ''}`}
      onClick={onClick}
    >
      {label}
      <span class={active ? 'text-accent' : 'text-overlay'}>{indicator}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ClimbTable({ initialClimbs, isAdmin, dataKey }: Props) {
  const [climbs, setClimbs] = useState<Climb[]>(initialClimbs);
  // Ordered list of active sorts — first entry is primary
  const [sorts, setSorts] = useState<SortEntry[]>([{key: 'grade', dir: 'desc'}, {key: 'date', dir: 'desc'}]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Climb | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const clickSort = (key: SortKey) => {
    setSorts(prev => {
      const existing = prev.find(s => s.key === key);
      const next = cycleDir(existing?.dir ?? null);
      // Remove this key from wherever it was
      const without = prev.filter(s => s.key !== key);
      // If cycling to null, drop it entirely; otherwise prepend as new primary
      return next === null ? without : [{ key, dir: next }, ...without];
    });
  };

  const startEdit = (climb: Climb) => {
    setDraft({ ...climb, tags: [...climb.tags] });
    setEditingId(climb.id);
    setIsNew(false);
  };

  const startNew = () => {
    const c = emptyClimb();
    setDraft(c);
    setEditingId(c.id);
    setIsNew(true);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
  };

  const persist = async (next: Climb[]) => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/${dataKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(await res.text());
      setClimbs(next);
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const commit = async () => {
    if (!draft) return;
    const next = isNew
      ? [...climbs, draft]
      : climbs.map(c => (c.id === draft.id ? draft : c));
    await persist(next);
    cancel();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this climb?')) return;
    await persist(climbs.filter(c => c.id !== id));
  };

  const setField = (field: keyof Climb, value: any) =>
    setDraft(d => (d ? { ...d, [field]: value } : d));

  const sorted = applySorts(climbs, sorts);
  const dirOf = (key: SortKey) => sorts.find(s => s.key === key)?.dir ?? null;

  return (
    <div>
      {saveError && <p class="save-error">{saveError}</p>}

      <div class="overflow-x-auto rounded-lg border border-border">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-surface">
              <th class="th">
                <SortHeader label="Date" dir={dirOf('date')} onClick={() => clickSort('date')} />
              </th>
              <th class="th">Name</th>
              <th class="th">
                <SortHeader label="Grade" dir={dirOf('grade')} onClick={() => clickSort('grade')} />
              </th>
              <th class="th">Tags</th>
              <th class="th">Notes</th>
              <th class="th">Media</th>
              {isAdmin && <th class="th">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map(climb =>
              editingId === climb.id && !isNew && draft ? (
                <ClimbRowEdit
                  key={climb.id}
                  draft={draft}
                  saving={saving}
                  onChange={setField}
                  onSave={commit}
                  onCancel={cancel}
                />
              ) : (
                <ClimbRow
                  key={climb.id}
                  climb={climb}
                  isAdmin={isAdmin}
                  editingAny={!!editingId}
                  onEdit={() => startEdit(climb)}
                  onDelete={() => remove(climb.id)}
                />
              )
            )}

            {isNew && draft && (
              <ClimbRowEdit
                key="__new__"
                draft={draft}
                saving={saving}
                onChange={setField}
                onSave={commit}
                onCancel={cancel}
              />
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && !editingId && (
        <button
          class="mt-2 w-full border border-dashed border-border text-accent text-sm font-semibold py-2 px-4 rounded-lg hover:bg-surface hover:border-accent transition-colors"
          onClick={startNew}
        >
          + Add climb
        </button>
      )}
    </div>
  );
}
