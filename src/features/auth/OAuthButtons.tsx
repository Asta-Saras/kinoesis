import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import type { WorkspaceType } from '../../config/workspaces';
import type { AuthProvider } from '../../services/auth';
import { GitHubIcon, GitLabIcon, GoogleIcon, MicrosoftIcon } from '../../components/icons/BrandIcons';
import { cn } from '../../lib/cn';

type Provider = { id: AuthProvider; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

const PROVIDERS: Record<WorkspaceType, Provider[]> = {
  developer: [
    { id: 'github', label: 'GitHub', icon: GitHubIcon },
    { id: 'gitlab', label: 'GitLab', icon: GitLabIcon },
  ],
  business: [
    { id: 'google', label: 'Google', icon: GoogleIcon },
    { id: 'microsoft', label: 'Microsoft', icon: MicrosoftIcon },
    { id: 'sso', label: 'SSO', icon: KeyRound },
  ],
};

interface OAuthButtonsProps {
  workspace: WorkspaceType;
  /** May navigate away (OAuth redirect), in which case the spinner stays until unload. */
  onSelect: (provider: AuthProvider) => void | Promise<void>;
  disabled?: boolean;
}

export function OAuthButtons({ workspace, onSelect, disabled }: OAuthButtonsProps) {
  const [pending, setPending] = useState<AuthProvider | null>(null);
  const providers = PROVIDERS[workspace];

  // Reset the spinner if the user comes back via the browser's Back button (bfcache).
  useEffect(() => {
    const reset = () => setPending(null);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const handle = async (id: AuthProvider) => {
    setPending(id);
    try {
      await onSelect(id);
    } catch {
      setPending(null);
    }
  };

  return (
    <div className={cn('grid gap-2', providers.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {providers.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled || pending !== null}
          onClick={() => handle(id)}
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white/[0.03] text-sm font-medium text-zinc-200 transition-colors hover:border-line-strong hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
          {label}
        </button>
      ))}
    </div>
  );
}
