import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isWorkspaceType, WORKSPACES, type WorkspaceType } from '../../config/workspaces';
import { useWorkspaceTheme } from '../../hooks/useWorkspaceTheme';
import { useAuthStore } from '../../stores/authStore';
import type { AuthProvider } from '../../services/auth';
import { Logo } from '../../components/brand/Logo';
import { AuthShowcase } from './AuthShowcase';
import { OAuthButtons } from './OAuthButtons';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { WorkspaceSwitch } from './WorkspaceSwitch';

type Mode = 'signin' | 'signup';

/**
 * Unified authentication gateway.
 * URL state: /auth?mode=signin|signup&as=developer|business — shareable and refresh-safe.
 */
export function AuthPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const signInWithProvider = useAuthStore((s) => s.signInWithProvider);

  const mode: Mode = params.get('mode') === 'signup' ? 'signup' : 'signin';
  const asParam = params.get('as');
  const workspace: WorkspaceType = isWorkspaceType(asParam) ? asParam : 'developer';
  const ws = WORKSPACES[workspace];

  useWorkspaceTheme(workspace);

  const update = (patch: Partial<{ mode: Mode; as: WorkspaceType }>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => next.set(k, v));
        return next;
      },
      { replace: true },
    );

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/home';
  const onSuccess = () => navigate(redirectTo, { replace: true });

  if (user) return <Navigate to={redirectTo} replace />;

  const onProvider = async (provider: AuthProvider) => {
    await signInWithProvider(provider, workspace);
    onSuccess();
  };

  return (
    <div className="grid min-h-screen bg-ink-950 text-zinc-100 min-[960px]:h-screen min-[960px]:grid-cols-[1.05fr_1fr] min-[960px]:overflow-hidden">
      <AuthShowcase workspace={workspace} />

      {/* On desktop only this column scrolls, so the page never gains a scrollbar. */}
      <main className="relative flex overflow-x-hidden px-5 py-10 sm:px-8 min-[960px]:overflow-y-auto">
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-accent/[0.07] blur-[120px]" />

        <div className="relative m-auto w-full max-w-[440px]">
          <Logo className="mb-10 min-[960px]:hidden" />

          <header className="mb-6">
            <h1 className="text-[26px] font-semibold tracking-tight text-white">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              {mode === 'signin' ? 'Sign in to Kinoesis as a' : 'Join Kinoesis as a'}{' '}
              <span className="font-medium text-accent">{ws.label}</span>. {ws.authSubtitle}
            </p>
          </header>

          <div className="mb-6">
            <div className="mb-2.5 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
              {mode === 'signin' ? 'Signing in as' : 'Account type'}
            </div>
            <WorkspaceSwitch value={workspace} onChange={(as) => update({ as })} />
          </div>

          <div className="rounded-2xl border border-line bg-ink-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
            <OAuthButtons workspace={workspace} onSelect={onProvider} />

            <div className="my-5 flex items-center gap-3 text-[11px] tracking-wider text-zinc-600 uppercase">
              <div className="h-px flex-1 bg-line" />
              or with email
              <div className="h-px flex-1 bg-line" />
            </div>

            {mode === 'signin' ? (
              <SignInForm key={workspace} workspace={workspace} onSuccess={onSuccess} onSwitchWorkspace={(as) => update({ as })} />
            ) : (
              <SignUpForm key={workspace} workspace={workspace} onSuccess={onSuccess} />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {mode === 'signin' ? 'New to Kinoesis?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => update({ mode: mode === 'signin' ? 'signup' : 'signin' })}
              className="cursor-pointer font-medium text-accent hover:underline"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
