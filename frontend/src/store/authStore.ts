import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organisation: string | null;
  is_active: boolean;
}

interface AuthState {
  accessToken: string | null;
  tokenExpiresAt: number | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

function parseTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      tokenExpiresAt: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({ accessToken: token, tokenExpiresAt: parseTokenExpiry(token), user, isAuthenticated: true }),
      setToken: (token) => set({ accessToken: token, tokenExpiresAt: parseTokenExpiry(token) }),
      logout: () =>
        set({ accessToken: null, tokenExpiresAt: null, user: null, isAuthenticated: false }),
      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return false;
        return Date.now() > tokenExpiresAt - 30000; // 30s buffer
      },
    }),
    {
      name: "infratrace-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        tokenExpiresAt: state.tokenExpiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
