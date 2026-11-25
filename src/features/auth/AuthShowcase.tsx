import { CheckCircle2 } from 'lucide-react';
import type { WorkspaceType } from '../../config/workspaces';
import { Logo } from '../../components/brand/Logo';
import { cn } from '../../lib/cn';
import { BusinessVisual, DeveloperVisual } from './ShowcaseVisuals';

const COPY: Record<WorkspaceType, { eyebrow: string; title: [string, string]; body: string; points: string[] }> = {
  developer: {
    eyebrow: '// for developers',
    title: ['Ship backends at the', 'speed of thought.'],
    body: 'Drag nodes, wire typed logic and let Kinoesis compile it into production-ready Go or JavaScript.',
    points: ['Real code output — zero lock-in', 'Typed data pins & live compilation', 'Git-friendly projects and CLI'],
  },
  business: {
    eyebrow: 'For business teams',
    title: ['Automate the work that', 'slows your team down.'],
    body: 'Connect the tools your teams already use and orchestrate workflows with enterprise-grade control.',
    points: ['SSO & role-based access control', 'Audit logs, approvals and governance', 'Shared workspaces for every team'],
  },
};

/** Left-hand brand panel of the auth gateway. Its look changes with the selected workspace. */
export function AuthShowcase({ workspace }: { workspace: WorkspaceType }) {
  const copy = COPY[workspace];
  const isDev = workspace === 'developer';

  return (
    <aside className="relative hidden h-screen flex-col justify-between overflow-hidden border-r border-line bg-ink-900 p-10 min-[960px]:flex xl:p-14">
      {/* Background layers — cross-fade between the two workspace moods */}
      <div className={cn('absolute inset-0 bg-dot-grid transition-opacity duration-700', isDev ? 'opacity-100' : 'opacity-0')} />
      <div className={cn('absolute inset-0 transition-opacity duration-700', isDev ? 'opacity-0' : 'opacity-100')}>
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="absolute right-[-6rem] bottom-[-4rem] h-[26rem] w-[26rem] rounded-full bg-pink-500/15 blur-[120px]" />
        <div className="absolute inset-0 bg-line-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>
      <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]" />

      <Logo className="relative" />

      <div key={workspace} className="relative my-8 flex min-h-0 flex-1 animate-fade-up items-center">
        <div className="w-full">{isDev ? <DeveloperVisual /> : <BusinessVisual />}</div>
      </div>

      <div key={`${workspace}-copy`} className="relative max-w-lg animate-fade-up">
        <p className={cn('mb-3 text-xs font-medium tracking-wide text-accent', isDev ? 'font-mono' : 'uppercase')}>
          {copy.eyebrow}
        </p>
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white xl:text-[2.1rem]">
          {copy.title[0]} <span className="text-gradient-accent">{copy.title[1]}</span>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">{copy.body}</p>
        <ul className="mt-6 space-y-2 [@media(max-height:860px)]:hidden">
          {copy.points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
