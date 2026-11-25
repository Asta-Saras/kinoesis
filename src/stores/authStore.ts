import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/auth';
import type { AuthProvider, SignInInput, SignUpInput, User } from '../services/auth';
import type { WorkspaceType } from '../config/workspaces';

interface AuthState {
  user: User | null;
  signUp: (input: SignUpInput) => Promise<User>;
  signIn: (input: SignInInput) => Promise<User>;
  signInWithProvider: (provider: AuthProvider, workspace: WorkspaceType) => Promise<User>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
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
      signInWithProvider: async (provider, workspace) => {
        const user = await authService.signInWithProvider(provider, workspace);
        set({ user });
        return user;
      },
      signOut: () => set({ user: null }),
    }),
    { name: 'kinoesis.session', partialize: (s) => ({ user: s.user }) },
  ),
);
