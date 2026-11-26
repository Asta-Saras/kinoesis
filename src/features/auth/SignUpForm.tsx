import { useState, type FormEvent } from 'react';
import { ArrowRight, AtSign, Building2, Lock, Mail, User, Users } from 'lucide-react';
import type { WorkspaceType } from '../../config/workspaces';
import { AuthError } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/cn';
import { FormAlert } from './FormAlert';
import { isFreeEmail, passwordScore, required, validateEmail, validatePassword, validateUsername } from './validation';

const TEAM_SIZES = ['1–10', '11–50', '51–200', '201–1000', '1000+'].map((v) => ({ value: v, label: `${v} people` }));

type Values = { name: string; email: string; password: string; username: string; company: string; teamSize: string; terms: boolean };
type Errors = Partial<Record<keyof Values, string>>;

interface SignUpFormProps {
  workspace: WorkspaceType;
  onSuccess: () => void;
}

export function SignUpForm({ workspace, onSuccess }: SignUpFormProps) {
  const signUp = useAuthStore((s) => s.signUp);
  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', username: '', company: '', teamSize: '', terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDev = workspace === 'developer';

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): Errors => ({
    name: required('Name')(values.name),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    username: isDev ? validateUsername(values.username) : undefined,
    company: !isDev ? required('Company name')(values.company) : undefined,
    teamSize: !isDev && !values.teamSize ? 'Select your team size.' : undefined,
    terms: values.terms ? undefined : 'Please accept the terms to continue.',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    try {
      await signUp({
        workspace,
        name: values.name,
        email: values.email,
        password: values.password,
        ...(isDev ? { username: values.username } : { company: values.company, teamSize: values.teamSize }),
      });
      onSuccess();
    } catch (err) {
      if (err instanceof AuthError && err.code === 'EMAIL_TAKEN') setErrors((e) => ({ ...e, email: err.message }));
      else if (err instanceof AuthError && err.code === 'USERNAME_TAKEN') setErrors((e) => ({ ...e, username: err.message }));
      else setFormError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <FormAlert message={formError} />}

      <Field
        label="Full name"
        icon={User}
        autoComplete="name"
        placeholder={isDev ? 'Ada Lovelace' : 'Jordan Rivera'}
        value={values.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name}
        autoFocus
      />

      {isDev ? (
        <Field
          label="Username"
          icon={AtSign}
          prefix="kinoesis.dev/"
          autoComplete="username"
          placeholder="ada"
          value={values.username}
          onChange={(e) => set('username', e.target.value.toLowerCase().replace(/\s/g, '-'))}
          error={errors.username}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
          <Field
            label="Company"
            icon={Building2}
            autoComplete="organization"
            placeholder="Acme Inc."
            value={values.company}
            onChange={(e) => set('company', e.target.value)}
            error={errors.company}
          />
          <Select
            label="Team size"
            icon={Users}
            placeholder="Select"
            options={TEAM_SIZES}
            value={values.teamSize}
            onChange={(v) => set('teamSize', v)}
            error={errors.teamSize}
          />
        </div>
      )}

      <Field
        label={isDev ? 'Email' : 'Work email'}
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder={isDev ? 'you@example.dev' : 'you@company.com'}
        value={values.email}
        onChange={(e) => set('email', e.target.value)}
        error={errors.email}
        hint={!isDev && isFreeEmail(values.email) ? 'Tip: use your company email so teammates can find your workspace.' : undefined}
      />

      <div className="space-y-2">
        <Field
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
        />
        {values.password && <StrengthMeter score={passwordScore(values.password)} />}
      </div>

      <div className="space-y-1">
        <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-zinc-400 select-none">
          <input
            type="checkbox"
            checked={values.terms}
            onChange={(e) => set('terms', e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-[var(--ws-accent)]"
          />
          <span>
            I agree to the <a className="text-zinc-200 hover:text-accent">Terms of Service</a> and{' '}
            <a className="text-zinc-200 hover:text-accent">Privacy Policy</a>.
          </span>
        </label>
        {errors.terms && <div className="text-xs text-red-400">{errors.terms}</div>}
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {isDev ? 'Create developer account' : 'Create business workspace'}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}

const STRENGTH = [
  { label: 'Too weak', color: 'bg-red-500' },
  { label: 'Weak', color: 'bg-orange-500' },
  { label: 'Fair', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-lime-400' },
  { label: 'Strong', color: 'bg-emerald-400' },
];

function StrengthMeter({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < score ? STRENGTH[score].color : 'bg-white/10')} />
        ))}
      </div>
      <span className="w-14 text-right text-[11px] text-zinc-500">{STRENGTH[score].label}</span>
    </div>
  );
}
