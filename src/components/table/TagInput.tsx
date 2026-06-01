import { useState } from 'preact/hooks';
import { PRESET_TAGS } from './types';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState('');

  const add = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };

  const remove = (tag: string) => onChange(value.filter(t => t !== tag));

  return (
    <div>
      <div class="flex flex-wrap gap-1 mb-1">
        {value.map(t => (
          <span key={t} class="inline-flex items-center gap-0.5 bg-surface2 text-cream text-[0.68rem] font-medium px-1.5 py-0.5 rounded">
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove ${t}`}
              class="text-muted hover:text-danger leading-none text-sm transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div>
        <input
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder="Add tag…"
          list="preset-tags"
          class="field w-28"
        />
        <datalist id="preset-tags">
          {PRESET_TAGS.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>
    </div>
  );
}
