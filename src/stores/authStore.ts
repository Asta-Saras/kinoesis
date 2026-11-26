import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as authService from '../services/auth';
import type { AuthProvider, SignInInput, SignUpInput, User } from '../services/auth';
import type { WorkspaceType } from '../config/workspaces';

export const isDemoMode = import.meta.env.DEV && import.meta.env.MODE === 'demo';

interface AuthState {
  user: User | null;
  enterDemo: (workspace: WorkspaceType) => void;
  signUp: (input: SignUpInput) => Promise<User>;
  signIn: (input: SignInInput) => Promise<User>;
  /** Redirects the browser to the provider — does not resolve with a user. */
  signInWithProvider: (provider: AuthProvider, workspace: WorkspaceType) => void;
  /** Re-syncs `user` with the server session. Returns the current user (or null). */
  refresh: () => Promise<User | null>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      enterDemo: (workspace) => {
        if (!isDemoMode) return;
        set({
          user: {
            id: 'demo',
            name: 'Demo Presenter',
            email: 'demo@kinoesis.example',
            username: 'demo',
            company: 'Demo workspace',
            workspace,
            provider: 'password',
            createdAt: new Date().toISOString(),
          },
        });
      },
      signUp: async (input) => {
        const user = await authService.signUp(input);
        set({ user });
        return user;
      },
      signIn: async (input) => {
        const user = await authService.signIn(input);
        set({ user });
        return user;
      },
      signInWithProvider: (provider, workspace) => authService.startOAuth(provider, workspace),
      refresh: async () => {
        if (isDemoMode) return get().user;
        const user = await authService.fetchCurrentUser();
        set({ user });
        return user;
      },
      signOut: () => {
        set({ user: null });
        if (isDemoMode) return;
        authService.signOut().catch(() => {
          /* cookie will expire on its own if the server is unreachable */
        });
      },
    }),
    // The persisted user is only a cache for instant UI — the cookie is the source of truth.
    {
      name: isDemoMode ? 'kinoesis.demo' : 'kinoesis.session',
      storage: createJSONStorage(() => isDemoMode ? sessionStorage : localStorage),
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
