"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import type { Theme } from "@/types/api";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated, updateUserPreferences } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleThemeChange = async () => {
    const newTheme: Theme = isDark ? "light" : "dark";
    setTheme(newTheme);
    
    // Save to database if user is logged in
    if (isAuthenticated) {
      await updateUserPreferences({ theme: newTheme });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
