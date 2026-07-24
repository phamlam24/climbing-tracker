import TagInput from './TagInput';
import { GRADES } from './types';
import type { Climb } from './types';

interface Props {
  draft: Climb;
  saving: boolean;
  grades?: string[];
  onChange: (field: keyof Climb, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ClimbRowEdit({ draft, saving, grades = GRADES, onChange, onSave, onCancel }: Props) {
  const set = (field: keyof Climb) => (e: Event) =>
    onChange(field, (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value);

  return (
    <tr class="border-b border-border last:border-0 bg-surface">
      <td class="td">
        <input type="date" value={draft.date} onInput={set('date')} class="field w-36" />
      </td>
      <td class="td">
        <input value={draft.name} onInput={set('name')} placeholder="Name" class="field w-full" />
      </td>
      <td class="td">
        <select value={draft.grade} onChange={set('grade')} class="field w-20">
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </td>
      <td class="td">
        <TagInput value={draft.tags} onChange={tags => onChange('tags', tags)} />
      </td>
      <td class="td">
        <textarea value={draft.notes} onInput={set('notes')} placeholder="Notes" rows={3} class="field w-full resize-y" />
      </td>
      <td class="td">
        <input value={draft.mediaUrl} onInput={set('mediaUrl')} placeholder="https://…" class="field w-full" />
      </td>
      <td class="td">
        <div class="flex gap-1.5">
          <button
            class="text-xs font-semibold px-2.5 py-1 rounded bg-accent text-mantle hover:bg-accent-h transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            class="text-xs font-semibold px-2.5 py-1 rounded bg-surface2 text-muted hover:text-cream transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}
