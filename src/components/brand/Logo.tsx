import { useId } from 'react';
import { cn } from '../../lib/cn';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/** Kinoesis mark — a "K" formed by a node graph. Colours follow the active workspace accent. */
export function Logo({ className, showWordmark = true }: LogoProps) {
  // Unique per instance: a duplicate id inside a display:none subtree breaks the gradient.
  const gradientId = `kino-logo-${useId().replace(/:/g, '')}`;
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" fill="none" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: 'var(--ws-accent)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ws-accent-2)' }} />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="31" height="31" rx="8" className="fill-ink-850 stroke-line-strong" />
        <path
          d="M10 8v16M10 16l10-8M13 14l7 10"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="8" r="2.4" className="fill-accent-2" />
        <circle cx="22" cy="24" r="2.4" className="fill-accent" />
      </svg>
      {showWordmark && <span className="text-[17px] font-semibold tracking-tight text-white">Kinoesis</span>}
    </div>
  );
}
