import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as users from '../store.js';
import { config } from '../config.js';
import { clearSession, consumeOAuthState, readSession, setOAuthState, setSession } from '../session.js';
import { OAuthError, PROVIDERS, isConfigured } from '../oauth/providers.js';

export const authRouter = Router();

const WORKSPACES = ['developer', 'business'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const workspaceLabel = (ws) => (ws === 'developer' ? 'Developer' : 'Business');

/** Uniform error body: { error: { code, message, workspace? } } */
const fail = (res, status, code, message, extra = {}) => res.status(status).json({ error: { code, message, ...extra } });

// ── Email / password ─────────────────────────────────────────────────────

authRouter.post('/signup', async (req, res) => {
  const { workspace, name, email, password, username, company, teamSize } = req.body ?? {};

  if (!WORKSPACES.includes(workspace)) return fail(res, 400, 'VALIDATION', 'Invalid workspace.');
  if (!name?.trim()) return fail(res, 400, 'VALIDATION', 'Name is required.');
  if (!EMAIL_RE.test(email ?? '')) return fail(res, 400, 'VALIDATION', 'Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8)
    return fail(res, 400, 'VALIDATION', 'Password must be at least 8 characters.');

  const normalizedEmail = email.trim().toLowerCase();
  if (await users.findByEmail(normalizedEmail))
    return fail(res, 409, 'EMAIL_TAKEN', 'An account with this email already exists.');

  const normalizedUsername = workspace === 'developer' ? username?.trim().toLowerCase() || undefined : undefined;
  if (normalizedUsername && (await users.usernameExists(normalizedUsername)))
    return fail(res, 409, 'USERNAME_TAKEN', 'That username is taken.');

  const user = await users.createUser({
    workspace,
    name: name.trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    company: workspace === 'business' ? company?.trim() || undefined : undefined,
    teamSize: workspace === 'business' ? teamSize || undefined : undefined,
    passwordHash: await bcrypt.hash(password, 10),
    provider: 'password',
  });

  setSession(res, user, 'password');
  res.status(201).json({ user: users.toPublic(user, 'password') });
});

authRouter.post('/signin', async (req, res) => {
  const { workspace, email, password } = req.body ?? {};
  const user = await users.findByEmail(String(email ?? '').trim().toLowerCase(), { withPassword: true });

  if (!user?.passwordHash || !(await bcrypt.compare(String(password ?? ''), user.passwordHash))) {
    // Account exists but was created with OAuth — tell the user how to get in.
    if (user && !user.passwordHash) {
      const via = PROVIDERS[user.provider]?.label ?? 'a social provider';
      return fail(res, 401, 'INVALID_CREDENTIALS', `This account uses ${via} sign-in. Use the ${via} button above.`);
    }
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }
  if (user.workspace !== workspace) {
    return fail(res, 403, 'WORKSPACE_MISMATCH', `This account is registered as a ${workspaceLabel(user.workspace)} account.`, {
      workspace: user.workspace,
    });
  }

  setSession(res, user, 'password');
  res.json({ user: users.toPublic(user, 'password') });
});

authRouter.post('/signout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

authRouter.get('/me', async (req, res) => {
  const session = readSession(req);
  const user = session && (await users.findById(session.userId));
  if (!user) {
    clearSession(res);
    return fail(res, 401, 'UNAUTHENTICATED', 'Not signed in.');
  }
  res.json({ user: users.toPublic(user, session.provider) });
});

/** Which OAuth providers have credentials configured. The frontend uses this to pick real vs demo sign-in. */
authRouter.get('/providers', (_req, res) => {
  res.json(Object.fromEntries(Object.entries(PROVIDERS).map(([id, p]) => [id, isConfigured(p)])));
});

// ── OAuth ────────────────────────────────────────────────────────────────

const callbackUrl = (provider) => `${config.appUrl}/api/auth/oauth/${provider}/callback`;

/** Send the browser back to the auth page with an error the UI can display. */
const redirectWithError = (res, { workspace = 'developer', code, message, accountWorkspace }) => {
  const params = new URLSearchParams({ as: workspace, oauthError: code, message });
  if (accountWorkspace) params.set('accountWorkspace', accountWorkspace);
  res.redirect(`${config.appUrl}/auth?${params}`);
};

// Step 1: frontend navigates here → we redirect to the provider's consent screen.
authRouter.get('/oauth/:provider', (req, res) => {
  const workspace = WORKSPACES.includes(req.query.workspace) ? req.query.workspace : 'developer';
  const provider = PROVIDERS[req.params.provider];

  if (!provider || !isConfigured(provider)) {
    return redirectWithError(res, { workspace, code: 'NOT_CONFIGURED', message: 'That sign-in method is not available yet.' });
  }

  const state = crypto.randomBytes(24).toString('hex');
  setOAuthState(res, { state, workspace, provider: req.params.provider });
  res.redirect(provider.authorizeUrl({ redirectUri: callbackUrl(req.params.provider), state }));
});

// Step 2: provider redirects back here with ?code&state.
authRouter.get('/oauth/:provider/callback', async (req, res) => {
  const providerId = req.params.provider;
  const provider = PROVIDERS[providerId];
  const saved = consumeOAuthState(req, res);
  const workspace = saved?.workspace ?? 'developer';

  if (!provider || !saved || saved.provider !== providerId || saved.state !== req.query.state) {
    return redirectWithError(res, { workspace, code: 'OAUTH_FAILED', message: 'Sign-in session expired. Please try again.' });
  }
  if (req.query.error) {
    return redirectWithError(res, { workspace, code: 'OAUTH_FAILED', message: `${provider.label} sign-in was cancelled.` });
  }

  try {
    const profile = await provider.fetchProfile({ code: String(req.query.code), redirectUri: callbackUrl(providerId) });
    const user = await findOrCreateOAuthUser(providerId, profile, workspace);

    if (user.workspace !== workspace) {
      return redirectWithError(res, {
        workspace,
        code: 'WORKSPACE_MISMATCH',
        message: `This account is registered as a ${workspaceLabel(user.workspace)} account.`,
        accountWorkspace: user.workspace,
      });
    }

    setSession(res, user, providerId);
    res.redirect(`${config.appUrl}/auth/callback`);
  } catch (err) {
    console.error(`[oauth:${providerId}]`, err);
    redirectWithError(res, {
      workspace,
      code: err instanceof OAuthError ? err.code : 'OAUTH_FAILED',
      message: `${provider.label} sign-in didn't complete. Please try again.`,
    });
  }
});

/**
 * Match by linked provider account first, then by email (linking the provider
 * to an existing account), otherwise create a new account in `workspace`.
 */
async function findOrCreateOAuthUser(provider, profile, workspace) {
  const email = profile.email.trim().toLowerCase();

  const linked = await users.findByLinkedAccount(provider, profile.providerId);
  if (linked) return linked;

  const existing = await users.findByEmail(email);
  if (existing) return users.linkAccount(existing.id, provider, profile.providerId, profile.avatarUrl);

  // Reuse the GitHub login as the Kinoesis username when it's free.
  let username;
  if (workspace === 'developer' && profile.username) {
    const candidate = profile.username.toLowerCase();
    if (!(await users.usernameExists(candidate))) username = candidate;
  }

  return users.createUser({
    name: profile.name,
    email,
    workspace,
    username,
    avatarUrl: profile.avatarUrl,
    provider,
    linkedAccounts: [{ provider, providerId: profile.providerId }],
  });
}
