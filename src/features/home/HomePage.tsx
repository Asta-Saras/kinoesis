import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Inbox, Plus } from 'lucide-react';
import { WORKSPACES } from '../../config/workspaces';
import { isDemoMode, useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

/** Minimal shared home page — content is driven by the workspace config. */
export function HomePage() {
  const user = useAuthStore((s) => s.user)!;
  const ws = WORKSPACES[user.workspace];
  const isDev = user.workspace === 'developer';
  const firstName = user.name.split(' ')[0];
  const noun = isDev ? 'flows' : 'workflows';
  const editorAction = isDemoMode ? 'Open sample flow' : ws.primaryAction;

  const checklist = [
    { label: 'Create your account', done: true },
    { label: isDev ? 'Build your first flow' : 'Build your first workflow', done: false },
    { label: isDev ? 'Generate an API key' : 'Connect your first app', done: false },
    { label: isDev ? 'Deploy to production' : 'Invite your team', done: false },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 md:px-8 md:py-10">
      {/* Hero */}
      <section className="flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={cn('text-xs font-medium text-accent', isDev ? 'font-mono' : 'tracking-wide uppercase')}>
            {isDev ? `~/${user.username ?? 'workspace'}` : `${user.company ?? 'Your company'} · ${ws.label}`}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">{ws.homeSubtitle}</p>
        </div>
        <Link to="/editor">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            {editorAction}
          </Button>
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ws.stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-ink-900/70 p-4 backdrop-blur">
            <div className="text-xs text-zinc-500">{s.label}</div>
            <div className={cn('mt-1.5 text-2xl font-semibold text-white tabular-nums', isDev && 'font-mono')}>{s.value}</div>
          </div>
        ))}
      </section>

      {/* Quick start */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Quick start</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {ws.quickActions.map(({ title, description, icon: Icon, to }) => {
            const card = (
              <div
                className={cn(
                  'group h-full rounded-xl border border-line bg-ink-900/70 p-5 backdrop-blur transition-all',
                  to ? 'cursor-pointer hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/[0.04]' : 'opacity-70',
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  {to ? (
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-accent" />
                  ) : (
                    <span className="rounded border border-line px-1.5 py-px text-[9px] tracking-wide text-zinc-500 uppercase">Soon</span>
                  )}
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-100">{isDemoMode && to === '/editor' ? editorAction : title}</div>
                <div className="mt-1 text-[13px] leading-snug text-zinc-500">
                  {isDemoMode && to === '/editor' ? 'Connect nodes and see the generated code update.' : description}
                </div>
              </div>
            );
            return to ? (
              <Link key={title} to={to}>
                {card}
              </Link>
            ) : (
              <div key={title}>{card}</div>
            );
          })}
        </div>
      </section>

      {/* Recent + onboarding */}
      <section className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-line bg-ink-900/70 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">{isDemoMode ? 'Example' : `Recent ${noun}`}</h2>
            {!isDemoMode && <span className="text-xs text-zinc-600">0 total</span>}
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-zinc-500">
              <Inbox className="h-5 w-5" />
            </span>
            <div className="mt-3 text-sm font-medium text-zinc-200">{isDemoMode ? 'Hello Kinoesis' : `No ${noun} yet`}</div>
            <div className="mt-1 max-w-xs text-[13px] text-zinc-500">
              {isDemoMode ? 'Run the sample, then wire a new value into Print.' : isDev
                ? 'Open the editor to wire your first graph and watch it compile to code.'
                : 'Create a workflow to start automating work across your tools.'}
            </div>
            <Link to="/editor" className="mt-4">
              <Button variant="secondary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                {editorAction}
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/70 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">Getting started</h2>
            <span className="text-xs text-accent">1 / {checklist.length}</span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${100 / checklist.length}%` }} />
          </div>
          <ul className="mt-4 space-y-1">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 rounded-lg px-1 py-2 text-[13px]">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border',
                    item.done ? 'border-accent bg-accent text-accent-fg' : 'border-zinc-700',
                  )}
                >
                  {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={item.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
