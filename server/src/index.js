import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { PROVIDERS, isConfigured } from './oauth/providers.js';
import { initStore, storeMode } from './store.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: storeMode() });
});

app.use('/api/auth', authRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }));

// Express 5 forwards async errors here automatically.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong on the server.' } });
});

// Pick MongoDB or the local file store first, then accept requests.
await initStore();

app.listen(config.port, () => {
  const status = Object.entries(PROVIDERS)
    .map(([id, p]) => `${id}: ${isConfigured(p) ? 'ready' : 'demo mode (no keys)'}`)
    .join(', ');
  console.log(`[api] listening on http://localhost:${config.port}  (storage: ${storeMode()})`);
  console.log(`[oauth] ${status}`);
});
