/**
 * Authentication service — talks to the Kinoesis API (`server/`).
 *
 * Sessions live in an httpOnly cookie set by the server, so no tokens are
 * handled in JS. In dev, Vite proxies `/api` to the backend (see vite.config.ts).
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
  avatarUrl?: string;
  createdAt: string;
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

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'WORKSPACE_MISMATCH'
  | 'VALIDATION'
  | 'NOT_CONFIGURED'
  | 'OAUTH_FAILED'
  | 'UNAUTHENTICATED'
  | 'DB_UNAVAILABLE'
  | 'NETWORK'
  | 'SERVER_ERROR';

export class AuthError extends Error {
  code: AuthErrorCode;
  workspace?: WorkspaceType;
  constructor(code: AuthErrorCode, message: string, workspace?: WorkspaceType) {
    super(message);
    this.code = code;
    this.workspace = workspace;
  }
}

const API = '/api/auth';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      credentials: 'include',
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new AuthError('NETWORK', "Can't reach the server. Make sure the backend is running (npm run server).");
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    if (!err) throw new AuthError('NETWORK', "Can't reach the server. Make sure the backend is running (npm run server).");
    throw new AuthError(err.code ?? 'SERVER_ERROR', err.message ?? 'Something went wrong.', err.workspace);
  }
  return body as T;
}

export async function signUp(input: SignUpInput): Promise<User> {
  const { user } = await request<{ user: User }>('/signup', { method: 'POST', body: JSON.stringify(input) });
  return user;
}

export async function signIn(input: SignInInput): Promise<User> {
  const { user } = await request<{ user: User }>('/signin', { method: 'POST', body: JSON.stringify(input) });
  return user;
}

export async function signOut(): Promise<void> {
  await request<void>('/signout', { method: 'POST' });
}

/** Returns the signed-in user, or null if the session is missing/expired. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { user } = await request<{ user: User }>('/me');
    return user;
  } catch (err) {
    if (err instanceof AuthError && err.code === 'UNAUTHENTICATED') return null;
    throw err;
  }
}

/**
 * Starts the OAuth redirect flow. The browser leaves the app, signs in with the
 * provider, and the server redirects back to `/auth/callback` (or `/auth?oauthError=…`).
 */
export function startOAuth(provider: AuthProvider, workspace: WorkspaceType): void {
  window.location.assign(`${API}/oauth/${provider}?workspace=${encodeURIComponent(workspace)}`);
}
