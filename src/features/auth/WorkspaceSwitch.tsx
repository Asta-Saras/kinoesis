import { Check } from 'lucide-react';
import { WORKSPACES, WORKSPACE_TYPES, type WorkspaceType } from '../../config/workspaces';
import { cn } from '../../lib/cn';

interface WorkspaceSwitchProps {
  value: WorkspaceType;
  onChange: (value: WorkspaceType) => void;
}

/** GitHub-style account-type picker: two radio cards, Developer and Business. */
export function WorkspaceSwitch({ value, onChange }: WorkspaceSwitchProps) {
  return (
    <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
      {WORKSPACE_TYPES.map((type) => {
        const ws = WORKSPACES[type];
        const selected = value === type;
        const Icon = ws.icon;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type)}
            className={cn(
              'group relative cursor-pointer rounded-xl border p-3.5 text-left transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
              selected
                ? 'border-accent/60 bg-accent/[0.08] shadow-[0_0_0_1px_color-mix(in_oklab,var(--ws-accent)_40%,transparent),0_12px_32px_-16px_var(--ws-accent)]'
                : 'border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.04]',
            )}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                  selected ? 'border-accent/40 bg-accent/15 text-accent' : 'border-line bg-white/[0.03] text-zinc-400',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border transition-all',
                  selected ? 'border-accent bg-accent text-accent-fg' : 'border-zinc-600',
                )}
              >
                {selected && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
              </span>
            </div>
            <div className={cn('mt-3 text-sm font-semibold', selected ? 'text-white' : 'text-zinc-300')}>{ws.label}</div>
            <div className="mt-0.5 text-xs leading-snug text-zinc-500">{ws.summary}</div>
          </button>
        );
      })}
    </div>
  );
}
