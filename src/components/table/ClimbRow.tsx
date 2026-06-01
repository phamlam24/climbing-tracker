import type { Climb } from './types';

interface Props {
  climb: Climb;
  isAdmin: boolean;
  editingAny: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ClimbRow({ climb, isAdmin, editingAny, onEdit, onDelete }: Props) {
  const gradeClass = `grade grade--${climb.grade.replace('+', 'plus')}`;

  return (
    <tr class="border-b border-border last:border-0 hover:bg-surface transition-colors">
      <td class="td text-muted text-xs whitespace-nowrap">{climb.date}</td>
      <td class="td font-medium text-text">{climb.name}</td>
      <td class="td"><span class={gradeClass}>{climb.grade}</span></td>
      <td class="td">
        <div class="flex flex-wrap gap-1">
          {climb.tags.map(t => (
            <span key={t} class="inline-flex items-center bg-surface2 text-muted text-[0.68rem] font-medium px-1.5 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>
      </td>
      <td class="td text-muted text-xs max-w-65">{climb.notes}</td>
      <td class="td whitespace-nowrap">
        {climb.mediaUrl && (
          <a href={climb.mediaUrl} target="_blank" rel="noopener" class="text-accent-h text-xs hover:underline">
            ▶ View
          </a>
        )}
      </td>
      {isAdmin && (
        <td class="td">
          <div class="flex gap-1.5">
            <button
              class="text-xs font-semibold px-2 py-1 rounded bg-surface2 text-text hover:bg-accent hover:text-mantle transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
              onClick={onEdit}
              disabled={editingAny}
            >
              Edit
            </button>
            <button
              class="text-xs font-semibold px-2 py-1 rounded text-danger hover:bg-danger/10 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
              onClick={onDelete}
              disabled={editingAny}
            >
              Del
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
