/** Centralised, validated environment config. */
const env = process.env;

export const config = {
  port: Number(env.PORT) || 4000,
  appUrl: (env.APP_URL || 'http://localhost:5173').replace(/\/$/, ''),
  jwtSecret: env.JWT_SECRET || '',
  // Optional: leave empty to store users in server/data/users.json instead.
  mongoUri: (env.MONGODB_URI || '').trim(),
  isProd: env.NODE_ENV === 'production',
  oauth: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      tenant: env.MICROSOFT_TENANT || 'common',
    },
  },
};

if (!config.jwtSecret || config.jwtSecret === 'change-me-to-a-long-random-string') {
  if (config.isProd) throw new Error('JWT_SECRET must be set in production.');
  console.warn('[config] JWT_SECRET is not set — using an insecure dev secret. Set it in server/.env.');
  config.jwtSecret = 'insecure-dev-secret-do-not-use-in-production';
}
