import mongoose from 'mongoose';

const linkedAccountSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['google', 'github', 'microsoft'], required: true },
    providerId: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    workspace: { type: String, enum: ['developer', 'business'], required: true },
    username: { type: String, trim: true, lowercase: true },
    company: { type: String, trim: true },
    teamSize: { type: String },
    avatarUrl: { type: String },
    /** Absent for accounts created purely via OAuth. */
    passwordHash: { type: String, select: false },
    /** How the account was first created. */
    provider: { type: String, enum: ['password', 'google', 'github', 'microsoft'], default: 'password' },
    linkedAccounts: { type: [linkedAccountSchema], default: [] },
  },
  { timestamps: true },
);

// Usernames are optional, but unique when present.
userSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { username: { $type: 'string' } } });
userSchema.index({ 'linkedAccounts.provider': 1, 'linkedAccounts.providerId': 1 });

/** Public shape returned to the client — mirrors the frontend `User` type. */
userSchema.methods.toPublic = function toPublic(sessionProvider) {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    workspace: this.workspace,
    provider: sessionProvider || this.provider,
    username: this.username || undefined,
    company: this.company || undefined,
    teamSize: this.teamSize || undefined,
    avatarUrl: this.avatarUrl || undefined,
    createdAt: this.createdAt.toISOString(),
  };
};

export const User = mongoose.model('User', userSchema);
