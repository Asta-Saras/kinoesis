import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Plus, Search } from 'lucide-react';
import { WORKSPACES } from '../config/workspaces';
import { useWorkspaceTheme } from '../hooks/useWorkspaceTheme';
import { useAuthStore } from '../stores/authStore';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Authenticated layout: sidebar + top bar. Styling adapts to the user's workspace. */
export function AppShell() {
  const user = useAuthStore((s) => s.user)!;
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const ws = WORKSPACES[user.workspace];
  const isDev = user.workspace === 'developer';
  const WsIcon = ws.icon;

  useWorkspaceTheme(user.workspace);

  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-ink-900 md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>

        <div className="px-3">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <WsIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-white">
                {isDev ? (user.username ? `@${user.username}` : user.name) : (user.company ?? 'My company')}
              </div>
              <div className={cn('text-[11px] text-accent', isDev && 'font-mono')}>{ws.label} workspace</div>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-0.5 px-3">
          <div className="px-2.5 pb-2 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">Navigate</div>
          {ws.nav.map(({ label, icon: Icon, to, soon }) =>
            to && !soon ? (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                    isActive ? 'bg-accent/10 text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent" />}
                    <Icon className={cn('h-4 w-4', isActive && 'text-accent')} />
                    {label}
                  </>
                )}
              </NavLink>
            ) : (
              <div key={label} className="flex h-9 cursor-not-allowed items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-zinc-600">
                <Icon className="h-4 w-4" />
                {label}
                <span className="ml-auto rounded border border-line px-1.5 py-px text-[9px] tracking-wide text-zinc-500 uppercase">
                  Soon
                </span>
              </div>
            ),
          )}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-xs font-semibold text-accent-fg">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-zinc-100">{user.name}</div>
              <div className="truncate text-[11px] text-zinc-500">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/auth', { replace: true });
              }}
              title="Sign out"
              className="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-ink-950/80 px-5 backdrop-blur md:px-8">
          <Logo showWordmark={false} className="md:hidden" />
          <div className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 text-sm text-zinc-500">
            <Search className="h-4 w-4" />
            <input
              placeholder={isDev ? 'Search flows, nodes, logs…' : 'Search workflows, apps, people…'}
              className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <kbd className="hidden shrink-0 rounded border border-line px-1.5 font-mono text-[10px] whitespace-nowrap text-zinc-500 sm:block">Ctrl K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="relative cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100" title="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
            <Link to="/editor">
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                {ws.primaryAction}
              </Button>
            </Link>
          </div>
        </header>

        <main className={cn('relative flex-1 overflow-y-auto', isDev ? 'bg-dot-grid' : '')}>
          {!isDev && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-violet-600/[0.08] via-pink-500/[0.03] to-transparent" />
          )}
          <div className="relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
