import { useState } from 'preact/hooks';
import ClimbRow from './ClimbRow';
import ClimbRowEdit from './ClimbRowEdit';
import { GRADES } from './types';
import type { Climb } from './types';

interface Props {
  initialClimbs: Climb[];
  isAdmin: boolean;
  dataKey: string;
  grades?: string[];
  defaultGrade?: string;
  onSendClimb?: (climb: Climb) => Promise<void>;
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

function applySorts(climbs: Climb[], sorts: SortEntry[], gradeList: string[]): Climb[] {
  if (!sorts.length) return climbs;
  return [...climbs].sort((a, b) => {
    for (const { key, dir } of sorts) {
      let cmp = 0;
      if (key === 'date') {
        cmp = a.date.localeCompare(b.date);
      } else if (key === 'grade') {
        cmp = gradeList.indexOf(a.grade) - gradeList.indexOf(b.grade);
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

const NOISE_RE = /warmup|warm-up|padding/i;
function isNoise(c: Climb) {
  return NOISE_RE.test(c.name) || NOISE_RE.test(c.notes);
}

function getYouTubeVideoId(url: string): { id: string; isShorts: boolean } | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id ? { id, isShorts: false } : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return { id: shorts[1], isShorts: true };
      const v = u.searchParams.get('v');
      if (v) return { id: v, isShorts: false };
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return { id: embed[1], isShorts: false };
    }
  } catch {}
  return null;
}

// ── Main component ────────────────────────────────────────────
export default function ClimbTable({ initialClimbs, isAdmin, dataKey, grades = GRADES, defaultGrade, onSendClimb }: Props) {
  const emptyClimbFn = () => ({
    id: crypto.randomUUID(),
    name: '',
    grade: defaultGrade ?? grades[0] ?? 'V0',
    tags: [] as string[],
    mediaUrl: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [climbs, setClimbs] = useState<Climb[]>(initialClimbs);
  // Ordered list of active sorts — first entry is primary
  const [sorts, setSorts] = useState<SortEntry[]>([{key: 'grade', dir: 'desc'}, {key: 'date', dir: 'desc'}]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Climb | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  const [infoClimb, setInfoClimb] = useState<Climb | null>(null);
  const [youtubeInfo, setYoutubeInfo] = useState<{ id: string; isShorts: boolean } | null>(null);

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
    const c = emptyClimbFn();
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
      const token = new URLSearchParams(window.location.search).get('admin');
      const apiUrl = token ? `/api/${dataKey}?admin=${encodeURIComponent(token)}` : `/api/${dataKey}`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(await res.text());
      setClimbs(next);
      window.location.reload();
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

  const send = onSendClimb
    ? async (climb: Climb) => {
        try {
          await onSendClimb(climb);
        } catch (e: any) {
          if (e?.message === 'cancelled') return;
          setSaveError(e?.message || 'Send failed');
          return;
        }
        await persist(climbs.filter(c => c.id !== climb.id));
      }
    : undefined;

  const setField = (field: keyof Climb, value: any) =>
    setDraft(d => (d ? { ...d, [field]: value } : d));

  const openYoutube = (url: string) => {
    const info = getYouTubeVideoId(url);
    if (info) setYoutubeInfo(info);
    else window.open(url, '_blank', 'noopener');
  };

  const sorted = applySorts(climbs, sorts, grades);
  const visible = collapsed ? sorted.filter(c => !isNoise(c) && !!c.mediaUrl) : sorted;
  const hiddenCount = sorted.length - sorted.filter(c => !isNoise(c) && !!c.mediaUrl).length;
  const dirOf = (key: SortKey) => sorts.find(s => s.key === key)?.dir ?? null;

  return (
    <div>
      {saveError && <p class="save-error">{saveError}</p>}

      {/* Mobile card list */}
      <div class="md:hidden flex flex-col gap-2">
        {visible.map(climb => {
          const gradeClass = `grade grade--${climb.grade.replace('+', 'plus')}`;
          return (
            <div key={climb.id} class="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
              <span class={gradeClass}>{climb.grade}</span>
              <span class="flex-1 font-medium text-text text-sm truncate">{climb.name}</span>
              {climb.mediaUrl && (
                <a
                  href={climb.mediaUrl}
                  target="_blank"
                  rel="noopener"
                  class="text-accent-h hover:text-accent transition-colors shrink-0"
                  title="Watch"
                  onClick={(e) => { e.preventDefault(); openYoutube(climb.mediaUrl); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </a>
              )}
              <button
                onClick={() => setInfoClimb(climb)}
                class="text-muted hover:text-text transition-colors shrink-0"
                title="Info"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </button>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <button
            class="text-[0.65rem] font-bold uppercase tracking-widest text-overlay hover:text-text transition-colors text-center py-1"
            onClick={() => setCollapsed(c => !c)}
          >
            {collapsed ? `Show all (${hiddenCount} hidden)` : 'Show filtered'}
          </button>
        )}
      </div>

      {/* YouTube overlay */}
      {youtubeInfo && (
        <div
          class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setYoutubeInfo(null)}
        >
          <div
            class={`relative w-full ${youtubeInfo.isShorts ? 'max-w-xs' : 'max-w-3xl'}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setYoutubeInfo(null)}
              class="absolute -top-8 right-0 text-white/70 hover:text-white transition-colors text-lg leading-none"
            >✕</button>
            <div class={`relative w-full ${youtubeInfo.isShorts ? 'aspect-9/16' : 'aspect-video'}`}>
              <iframe
                class="absolute inset-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${youtubeInfo.id}?autoplay=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Info overlay */}
      {infoClimb && (
        <div
          class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setInfoClimb(null)}
        >
          <div
            class="bg-mantle border border-border rounded-xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div class="flex items-center justify-between mb-4">
              <span class={`grade grade--${infoClimb.grade.replace('+', 'plus')}`}>{infoClimb.grade}</span>
              <button onClick={() => setInfoClimb(null)} class="text-muted hover:text-text transition-colors text-lg leading-none">✕</button>
            </div>
            <h2 class="text-text font-semibold text-[1rem] mb-1">{infoClimb.name}</h2>
            <p class="text-muted text-xs mb-3">{infoClimb.date}</p>
            {infoClimb.tags.length > 0 && (
              <div class="flex flex-wrap gap-1 mb-3">
                {infoClimb.tags.map(t => (
                  <span key={t} class="inline-flex items-center bg-surface2 text-muted text-[0.68rem] font-medium px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
            {infoClimb.notes && <p class="text-text text-sm mb-4">{infoClimb.notes}</p>}
            {infoClimb.mediaUrl && (
              <a
                href={infoClimb.mediaUrl}
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-2 text-accent-h text-sm hover:underline"
                onClick={(e) => { e.preventDefault(); setInfoClimb(null); openYoutube(infoClimb.mediaUrl); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Watch
              </a>
            )}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div class="hidden md:block overflow-x-auto rounded-lg border border-border">
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
              <th class="th text-right" colspan={isAdmin ? 2 : 1} style="min-width: 8rem">
                {hiddenCount > 0 && (
                  <button
                    class="text-[0.65rem] font-bold uppercase tracking-widest text-overlay hover:text-text transition-colors"
                    onClick={() => setCollapsed(c => !c)}
                  >
                    {collapsed ? `Show all (${hiddenCount} hidden)` : 'Show filtered'}
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map(climb =>
              editingId === climb.id && !isNew && draft ? (
                <ClimbRowEdit
                  key={climb.id}
                  draft={draft}
                  saving={saving}
                  grades={grades}
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
                  onSend={send ? () => send(climb) : undefined}
                  onWatch={climb.mediaUrl && getYouTubeVideoId(climb.mediaUrl) ? () => openYoutube(climb.mediaUrl) : undefined}
                />
              )
            )}

            {isNew && draft && (
              <ClimbRowEdit
                key="__new__"
                draft={draft}
                saving={saving}
                grades={grades}
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
          class="hidden md:block mt-2 w-full border border-dashed border-border text-accent text-sm font-semibold py-2 px-4 rounded-lg hover:bg-surface hover:border-accent transition-colors"
          onClick={startNew}
        >
          + Add climb
        </button>
      )}
    </div>
  );
}
