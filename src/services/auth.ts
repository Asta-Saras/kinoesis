/**
 * Mock authentication service.
 *
 * Everything here is client-side only and persisted in localStorage so the
 * frontend can be built end-to-end before a backend exists. Swap these
 * functions for real HTTP calls later — the store and UI only depend on the
 * exported signatures.
 */
import type { WorkspaceType } from '../config/workspaces';

export type AuthProvider = 'password' | 'github' | 'gitlab' | 'google' | 'microsoft' | 'sso';

export interface User {
  id: string;
  name: string;
  email: string;
  workspace: WorkspaceType;
  provider: AuthProvider;
  username?: string;
  company?: string;
  teamSize?: string;
  createdAt: string;
}

interface StoredAccount extends User {
  passwordHash?: string;
}

export interface SignUpInput {
  workspace: WorkspaceType;
  name: string;
  email: string;
  password: string;
  username?: string;
  company?: string;
  teamSize?: string;
}

export interface SignInInput {
  workspace: WorkspaceType;
  email: string;
  password: string;
}

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN' | 'USERNAME_TAKEN' | 'WORKSPACE_MISMATCH';

export class AuthError extends Error {
  code: AuthErrorCode;
  workspace?: WorkspaceType;
  constructor(code: AuthErrorCode, message: string, workspace?: WorkspaceType) {
    super(message);
    this.code = code;
    this.workspace = workspace;
  }
}

const ACCOUNTS_KEY = 'kinoesis.accounts';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const readAccounts = (): StoredAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]') as StoredAccount[];
  } catch {
    return [];
  }
};

const writeAccounts = (accounts: StoredAccount[]) =>
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

async function hash(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const toUser = (account: StoredAccount): User => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = account;
  return user;
};

export async function signUp(input: SignUpInput): Promise<User> {
  await delay(700);
  const accounts = readAccounts();
  const email = input.email.trim().toLowerCase();

  if (accounts.some((a) => a.email === email)) {
    throw new AuthError('EMAIL_TAKEN', 'An account with this email already exists.');
  }
  if (input.username && accounts.some((a) => a.username === input.username)) {
    throw new AuthError('USERNAME_TAKEN', 'That username is taken.');
  }

  const account: StoredAccount = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    workspace: input.workspace,
    provider: 'password',
    username: input.username?.trim() || undefined,
    company: input.company?.trim() || undefined,
    teamSize: input.teamSize || undefined,
    createdAt: new Date().toISOString(),
    passwordHash: await hash(input.password),
  };
  writeAccounts([...accounts, account]);
  return toUser(account);
}

export async function signIn(input: SignInInput): Promise<User> {
  await delay(600);
  const email = input.email.trim().toLowerCase();
  const account = readAccounts().find((a) => a.email === email);

  if (!account || !account.passwordHash || account.passwordHash !== (await hash(input.password))) {
    throw new AuthError('INVALID_CREDENTIALS', 'Incorrect email or password.');
  }
  if (account.workspace !== input.workspace) {
    throw new AuthError(
      'WORKSPACE_MISMATCH',
      `This account is registered as a ${account.workspace === 'developer' ? 'Developer' : 'Business'} account.`,
      account.workspace,
    );
  }
  return toUser(account);
}

export async function signInWithProvider(provider: AuthProvider, workspace: WorkspaceType): Promise<User> {
  await delay(800);
  const name = workspace === 'developer' ? 'Demo Developer' : 'Demo Business';
  return {
    id: crypto.randomUUID(),
    name,
    email: `demo+${provider}@kinoesis.dev`,
    workspace,
    provider,
    username: workspace === 'developer' ? 'demo-dev' : undefined,
    company: workspace === 'business' ? 'Acme Inc.' : undefined,
    createdAt: new Date().toISOString(),
  };
}
