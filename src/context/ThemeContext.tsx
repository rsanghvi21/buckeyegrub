/**
 * BuckeyeGrub Design System – Theme Context Provider
 * Provides reactive Light/Dark theme semantics, synchronizing user preferences
 * from useUserStore with device appearance (useColorScheme).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getThemeColors } from '../constants/theme';
import { useUserStore } from '../store/useUserStore';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AppTheme = ReturnType<typeof getThemeColors>;

export interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const themePreference = useUserStore((state) => state.profile.preferences?.theme ?? 'system');
  const updateProfile = useUserStore((state) => state.updateProfile);

  const isDark = useMemo(() => {
    if (themePreference === 'dark') return true;
    if (themePreference === 'light') return false;
    return systemScheme === 'dark';
  }, [themePreference, systemScheme]);

  const theme = useMemo(() => getThemeColors(isDark), [isDark]);

  const setThemeMode = (mode: ThemeMode) => {
    updateProfile({
      preferences: {
        theme: mode,
      },
    });
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark,
      themeMode: themePreference,
      setThemeMode,
      toggleTheme,
    }),
    [theme, isDark, themePreference]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if invoked outside ThemeProvider
    const systemScheme = useColorScheme();
    const isDark = systemScheme === 'dark';
    return {
      theme: getThemeColors(isDark),
      isDark,
      themeMode: 'system',
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
