"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User, Token } from "@/types/api";
import { authApi } from "@/lib/api";

const TOKEN_KEY = "auth_tokens";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokens: Token) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredTokens(): Token | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(TOKEN_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setStoredTokens(tokens: Token | null) {
  if (typeof window === "undefined") return;
  if (tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.access_token ?? null;
  }, []);

  const logout = useCallback(() => {
    setStoredTokens(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const userData = await authApi.getMe(token);
      setUser(userData);
    } catch {
      logout();
    }
  }, [logout]);

  const login = useCallback(async (tokens: Token) => {
    setStoredTokens(tokens);
    await fetchUser(tokens.access_token);
    router.push("/dashboard");
  }, [fetchUser, router]);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();
      if (tokens?.access_token) {
        await fetchUser(tokens.access_token);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
