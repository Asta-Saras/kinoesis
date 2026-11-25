import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: ReactNode;
  /** Text rendered inside the field before the value, e.g. a URL prefix. */
  prefix?: string;
  labelAction?: ReactNode;
}

export function Field({ label, icon: Icon, error, hint, prefix, labelAction, type, className, id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-300">
          {label}
        </label>
        {labelAction}
      </div>
      <div
        className={cn(
          'group flex h-10 items-center rounded-lg border bg-ink-900/80 transition-colors',
          'focus-within:border-accent/70 focus-within:ring-3 focus-within:ring-accent/15',
          error ? 'border-red-500/60' : 'border-line hover:border-line-strong',
        )}
      >
        {Icon && <Icon className="ml-3 h-4 w-4 shrink-0 text-zinc-500 group-focus-within:text-accent" />}
        {prefix && <span className="pl-3 font-mono text-[13px] text-zinc-500 select-none">{prefix}</span>}
        <input
          id={inputId}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${inputId}-msg` : undefined}
          className={cn(
            'h-full w-full min-w-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none',
            prefix ? 'pl-0.5 pr-3' : 'px-3',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="mr-2 cursor-pointer rounded p-1 text-zinc-500 hover:text-zinc-200"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <div id={`${inputId}-msg`} className={cn('text-xs', error ? 'text-red-400' : 'text-zinc-500')}>
          {error ?? hint}
        </div>
      )}
    </div>
  );
}
