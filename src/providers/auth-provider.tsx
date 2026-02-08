"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { User, Token, Language, Theme } from "@/types/api";
import { authApi } from "@/lib/api";
import { locales, type Locale } from "@/i18n/config";

const TOKEN_KEY = "auth_tokens";

interface UserUpdateData {
  language?: Language;
  theme?: Theme;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokens: Token) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  updateUserPreferences: (prefs: UserUpdateData) => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const pathname = usePathname();
  const { setTheme } = useTheme();

  // Extract locale from pathname
  const getLocaleFromPath = useCallback(() => {
    const segments = pathname.split("/");
    const possibleLocale = segments[1];
    if (locales.includes(possibleLocale as Locale)) {
      return possibleLocale as Locale;
    }
    return "en" as Locale;
  }, [pathname]);

  // Apply user preferences (theme and language)
  const applyUserPreferences = useCallback((userData: User) => {
    // Apply theme
    setTheme(userData.theme);
    
    // Apply language by navigating to the correct locale
    const currentLocale = getLocaleFromPath();
    if (userData.language !== currentLocale) {
      const segments = pathname.split("/");
      if (locales.includes(segments[1] as Locale)) {
        segments[1] = userData.language;
      } else {
        segments.splice(1, 0, userData.language);
      }
      // Don't navigate here, will be done in login
    }
  }, [setTheme, getLocaleFromPath, pathname]);

  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.access_token ?? null;
  }, []);

  const logout = useCallback(() => {
    const locale = getLocaleFromPath();
    setStoredTokens(null);
    setUser(null);
    // Force a hard reload to ensure all state is cleared
    window.location.href = `/${locale}/login`;
  }, [getLocaleFromPath]);

  const fetchUser = useCallback(async (token: string, applyPrefs = false) => {
    try {
      const userData = await authApi.getMe(token);
      setUser(userData);
      if (applyPrefs) {
        applyUserPreferences(userData);
      }
      return userData;
    } catch {
      logout();
      return null;
    }
  }, [logout, applyUserPreferences]);

  const login = useCallback(async (tokens: Token) => {
    setStoredTokens(tokens);
    const userData = await fetchUser(tokens.access_token, true);
    if (userData) {
      const basePath = `/${userData.language}/dashboard`;
      if (userData.role === "owner" || userData.role === "superuser") {
        router.push(basePath);
      } else if (userData.school_id) {
        router.push(`${basePath}/schools/${userData.school_id}`);
      } else {
        router.push(basePath);
      }
    }
  }, [fetchUser, router]);

  const updateUserPreferences = useCallback(async (prefs: UserUpdateData) => {
    const token = getAccessToken();
    if (!token || !user) return;

    try {
      const updatedUser = await authApi.updateMe(token, prefs);
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      throw error;
    }
  }, [getAccessToken, user]);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    await fetchUser(token, false);
  }, [getAccessToken, fetchUser]);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();
      if (tokens?.access_token) {
        const userData = await fetchUser(tokens.access_token, false);
        if (userData) {
          // Apply theme on page load (but don't redirect)
          setTheme(userData.theme);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser, setTheme]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        getAccessToken,
        updateUserPreferences,
        refreshUser,
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
