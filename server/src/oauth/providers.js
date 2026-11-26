/**
 * OAuth 2.0 authorization-code flow for each supported provider.
 * Each provider exposes:
 *   authorizeUrl({ redirectUri, state }) -> string
 *   fetchProfile({ code, redirectUri })  -> { providerId, email, name, avatarUrl, username? }
 */
import { config } from '../config.js';

export class OAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function json(res, what) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const detail = body.error_description || body.error?.message || body.error || res.statusText;
    throw new OAuthError('OAUTH_FAILED', `${what} failed: ${detail}`);
  }
  return body;
}

const form = (data) => new URLSearchParams(Object.entries(data).filter(([, v]) => v != null));

// ── Google ───────────────────────────────────────────────────────────────
const google = {
  label: 'Google',
  get creds() {
    return config.oauth.google;
  },
  authorizeUrl({ redirectUri, state }) {
    return `https://accounts.google.com/o/oauth2/v2/auth?${form({
      client_id: this.creds.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    })}`;
  },
  async fetchProfile({ code, redirectUri }) {
    const token = await json(
      await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({
          code,
          client_id: this.creds.clientId,
          client_secret: this.creds.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }),
      'Google token exchange',
    );
    const p = await json(
      await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      }),
      'Google profile',
    );
    if (!p.email || p.email_verified === false) throw new OAuthError('OAUTH_FAILED', 'Your Google email is not verified.');
    return { providerId: p.sub, email: p.email, name: p.name || p.email.split('@')[0], avatarUrl: p.picture };
  },
};

// ── GitHub ───────────────────────────────────────────────────────────────
const github = {
  label: 'GitHub',
  get creds() {
    return config.oauth.github;
  },
  authorizeUrl({ redirectUri, state }) {
    return `https://github.com/login/oauth/authorize?${form({
      client_id: this.creds.clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      allow_signup: 'true',
      state,
    })}`;
  },
  async fetchProfile({ code, redirectUri }) {
    const token = await json(
      await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({
          client_id: this.creds.clientId,
          client_secret: this.creds.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }),
      'GitHub token exchange',
    );
    const headers = {
      Authorization: `Bearer ${token.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kinoesis',
    };
    const p = await json(await fetch('https://api.github.com/user', { headers }), 'GitHub profile');

    // The public email is often hidden — ask for the primary verified one.
    let email = p.email;
    if (!email) {
      const emails = await json(await fetch('https://api.github.com/user/emails', { headers }), 'GitHub emails');
      email = (emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified))?.email;
    }
    if (!email) throw new OAuthError('OAUTH_FAILED', 'Your GitHub account has no verified email address.');

    return { providerId: String(p.id), email, name: p.name || p.login, avatarUrl: p.avatar_url, username: p.login };
  },
};

// ── Microsoft (Entra ID, v2 endpoint) ────────────────────────────────────
const microsoft = {
  label: 'Microsoft',
  scope: 'openid profile email User.Read',
  get creds() {
    return config.oauth.microsoft;
  },
  get base() {
    return `https://login.microsoftonline.com/${this.creds.tenant}/oauth2/v2.0`;
  },
  authorizeUrl({ redirectUri, state }) {
    return `${this.base}/authorize?${form({
      client_id: this.creds.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: this.scope,
      prompt: 'select_account',
      state,
    })}`;
  },
  async fetchProfile({ code, redirectUri }) {
    const token = await json(
      await fetch(`${this.base}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({
          client_id: this.creds.clientId,
          client_secret: this.creds.clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: this.scope,
        }),
      }),
      'Microsoft token exchange',
    );
    const p = await json(
      await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: `Bearer ${token.access_token}` } }),
      'Microsoft profile',
    );
    const email = p.mail || p.userPrincipalName;
    if (!email) throw new OAuthError('OAUTH_FAILED', 'Could not read an email from your Microsoft account.');
    return { providerId: p.id, email, name: p.displayName || email.split('@')[0] };
  },
};

export const PROVIDERS = { google, github, microsoft };

export const isConfigured = (provider) => Boolean(provider.creds.clientId && provider.creds.clientSecret);
