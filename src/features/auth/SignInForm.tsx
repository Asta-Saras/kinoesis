import { useState, type FormEvent } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import type { WorkspaceType } from '../../config/workspaces';
import { AuthError } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { FormAlert } from './FormAlert';
import { validateEmail } from './validation';

interface SignInFormProps {
  workspace: WorkspaceType;
  onSuccess: () => void;
  onSwitchWorkspace: (ws: WorkspaceType) => void;
}

export function SignInForm({ workspace, onSuccess, onSwitchWorkspace }: SignInFormProps) {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: validateEmail(email), password: password ? undefined : 'Password is required.' };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      await signIn({ email, password, workspace });
      onSuccess();
    } catch (err) {
      setFormError(err instanceof AuthError ? err : new AuthError('INVALID_CREDENTIALS', 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && (
        <FormAlert
          message={formError.message}
          action={
            formError.code === 'WORKSPACE_MISMATCH' && formError.workspace
              ? {
                  label: `Switch to ${formError.workspace === 'developer' ? 'Developer' : 'Business'}`,
                  onClick: () => {
                    onSwitchWorkspace(formError.workspace!);
                    setFormError(null);
                  },
                }
              : undefined
          }
        />
      )}
      <Field
        label={workspace === 'business' ? 'Work email' : 'Email'}
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder={workspace === 'business' ? 'you@company.com' : 'you@example.dev'}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoFocus
      />
      <Field
        label="Password"
        icon={Lock}
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        labelAction={
          <button type="button" className="cursor-pointer text-xs font-medium text-accent hover:underline">
            Forgot password?
          </button>
        }
      />
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-zinc-400 select-none">
        <input type="checkbox" defaultChecked className="h-3.5 w-3.5 cursor-pointer accent-[var(--ws-accent)]" />
        Keep me signed in
      </label>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Sign in as {workspace === 'developer' ? 'Developer' : 'Business'}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
