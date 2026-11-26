/**
 * User repository with two interchangeable backends:
 *   - MongoDB (when MONGODB_URI is set and reachable)
 *   - A local JSON file in server/data/users.json (automatic fallback)
 *
 * The rest of the app only uses the functions exported here, so auth keeps
 * working even when no database has been set up.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from './config.js';
import { User as UserModel } from './models/User.js';

let mode = 'file'; // 'mongo' | 'file'
export const storeMode = () => mode;

/** Try MongoDB; fall back to the JSON file store if it's missing or unreachable. */
export async function initStore() {
  if (!config.mongoUri) {
    console.log('[db] MONGODB_URI not set — using local file storage (server/data/users.json).');
    return;
  }
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 4000 });
    mode = 'mongo';
    console.log(`[db] connected to MongoDB ${config.mongoUri.replace(/\/\/[^@]*@/, '//***@')}`);
  } catch (err) {
    console.warn(`[db] MongoDB unavailable (${err.message}) — using local file storage instead.`);
    await mongoose.disconnect().catch(() => {});
  }
}

// ── Plain-object shape shared by both backends ───────────────────────────
// { id, name, email, workspace, username?, company?, teamSize?, avatarUrl?,
//   passwordHash?, provider, linkedAccounts: [{provider, providerId}], createdAt }

const fromMongo = (doc) =>
  doc && {
    ...doc,
    id: doc._id.toString(),
    _id: undefined,
    __v: undefined,
    createdAt: new Date(doc.createdAt).toISOString(),
  };

// ── File backend ─────────────────────────────────────────────────────────
const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'users.json');
let cache = null;
let writeQueue = Promise.resolve();

async function readAll() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch {
    cache = [];
  }
  return cache;
}

function persist() {
  const snapshot = JSON.stringify(cache, null, 2);
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, snapshot);
  });
  return writeQueue;
}

const strip = (u, withPassword) => {
  if (!u) return null;
  const copy = structuredClone(u);
  if (!withPassword) delete copy.passwordHash;
  return copy;
};

// ── Public API ───────────────────────────────────────────────────────────

export async function findByEmail(email, { withPassword = false } = {}) {
  if (mode === 'mongo') {
    const q = UserModel.findOne({ email }).lean();
    return fromMongo(await (withPassword ? q.select('+passwordHash') : q));
  }
  return strip((await readAll()).find((u) => u.email === email), withPassword);
}

export async function findById(id) {
  if (mode === 'mongo') {
    if (!mongoose.isValidObjectId(id)) return null;
    return fromMongo(await UserModel.findById(id).lean());
  }
  return strip((await readAll()).find((u) => u.id === id));
}

export async function findByLinkedAccount(provider, providerId) {
  if (mode === 'mongo') {
    return fromMongo(await UserModel.findOne({ linkedAccounts: { $elemMatch: { provider, providerId } } }).lean());
  }
  return strip(
    (await readAll()).find((u) => u.linkedAccounts?.some((a) => a.provider === provider && a.providerId === providerId)),
  );
}

export async function usernameExists(username) {
  if (mode === 'mongo') return Boolean(await UserModel.exists({ username }));
  return (await readAll()).some((u) => u.username === username);
}

export async function createUser(data) {
  if (mode === 'mongo') {
    const doc = await UserModel.create(data);
    return fromMongo(doc.toObject());
  }
  const users = await readAll();
  const user = {
    id: crypto.randomUUID(),
    linkedAccounts: [],
    ...JSON.parse(JSON.stringify(data)), // drop undefined fields
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await persist();
  return strip(user);
}

export async function linkAccount(userId, provider, providerId, avatarUrl) {
  if (mode === 'mongo') {
    const doc = await UserModel.findById(userId);
    doc.linkedAccounts.push({ provider, providerId });
    if (!doc.avatarUrl && avatarUrl) doc.avatarUrl = avatarUrl;
    await doc.save();
    return fromMongo(doc.toObject());
  }
  const user = (await readAll()).find((u) => u.id === userId);
  user.linkedAccounts = [...(user.linkedAccounts ?? []), { provider, providerId }];
  if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
  await persist();
  return strip(user);
}

/** Public shape returned to the client — mirrors the frontend `User` type. */
export function toPublic(user, sessionProvider) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    workspace: user.workspace,
    provider: sessionProvider || user.provider,
    username: user.username || undefined,
    company: user.company || undefined,
    teamSize: user.teamSize || undefined,
    avatarUrl: user.avatarUrl || undefined,
    createdAt: user.createdAt,
  };
}
