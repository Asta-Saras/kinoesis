import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const SESSION_COOKIE = 'kinoesis_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: maxAgeMs,
});

/** Issue a signed session cookie for the given user. */
export function setSession(res, user, provider) {
  const token = jwt.sign({ sub: user.id, provider }, config.jwtSecret, { expiresIn: SESSION_TTL_SECONDS });
  res.cookie(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS * 1000));
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(0), maxAge: undefined });
}

/** Returns `{ userId, provider }` or null. */
export function readSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { userId: payload.sub, provider: payload.provider };
  } catch {
    return null;
  }
}

// ── Short-lived OAuth "state" cookie (CSRF protection for the redirect flow) ──

export const OAUTH_COOKIE = 'kinoesis_oauth';

export function setOAuthState(res, data) {
  const token = jwt.sign(data, config.jwtSecret, { expiresIn: 600 });
  res.cookie(OAUTH_COOKIE, token, { ...cookieOptions(600 * 1000), path: '/api/auth/oauth' });
}

export function consumeOAuthState(req, res) {
  const token = req.cookies?.[OAUTH_COOKIE];
  res.clearCookie(OAUTH_COOKIE, { path: '/api/auth/oauth' });
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}
