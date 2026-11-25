const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,37}[a-z0-9])?$/;

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com'];

export const validateEmail = (v: string) => {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address.';
};

export const validateUsername = (v: string) => {
  if (!v.trim()) return 'Username is required.';
  if (!USERNAME_RE.test(v)) return 'Use 3–39 lowercase letters, numbers or hyphens.';
};

export const validatePassword = (v: string) => {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Use at least 8 characters.';
};

export const required = (label: string) => (v: string) => (!v.trim() ? `${label} is required.` : undefined);

export const isFreeEmail = (v: string) => FREE_EMAIL_DOMAINS.includes(v.split('@')[1]?.toLowerCase() ?? '');

/** 0–4 score used by the strength meter. */
export function passwordScore(v: string) {
  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
  return Math.min(score, 4);
}
