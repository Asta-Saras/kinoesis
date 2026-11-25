import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: LucideIcon;
  error?: string;
  placeholder?: string;
  className?: string;
}

/** Fully styled listbox (native <select> popups can't be themed consistently). */
export function Select({ label, value, onChange, options, icon: Icon, error, placeholder = 'Select', className }: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') setActive((i) => Math.min(options.length - 1, i + 1));
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1));
    else if (e.key === 'Enter' || e.key === ' ') choose(options[active].value);
    else if (e.key === 'Escape' || e.key === 'Tab') return setOpen(false);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={rootRef} className={cn('relative space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label id={`${id}-label`} className="text-[13px] font-medium text-zinc-300">
          {label}
        </label>
      </div>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        aria-invalid={!!error}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'group flex h-10 w-full cursor-pointer items-center rounded-lg border bg-ink-900/80 text-left text-sm transition-colors',
          'focus:outline-none focus-visible:border-accent/70 focus-visible:ring-3 focus-visible:ring-accent/15',
          open && 'border-accent/70 ring-3 ring-accent/15',
          !open && (error ? 'border-red-500/60' : 'border-line hover:border-line-strong'),
        )}
      >
        {Icon && <Icon className={cn('ml-3 h-4 w-4 shrink-0', open ? 'text-accent' : 'text-zinc-500')} />}
        <span className={cn('flex-1 truncate px-3', selected ? 'text-zinc-100' : 'text-zinc-600')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cn('mr-3 h-4 w-4 shrink-0 text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute top-full right-0 left-0 z-30 mt-1.5 animate-fade-up overflow-hidden rounded-lg border border-line-strong bg-ink-850 p-1 shadow-2xl shadow-black/60"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o.value);
              }}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-[13px]',
                i === active ? 'bg-accent/15 text-white' : 'text-zinc-300',
              )}
            >
              {o.label}
              {o.value === value && <Check className="h-3.5 w-3.5 text-accent" />}
            </li>
          ))}
        </ul>
      )}
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}
