import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemeMode = 'polished' | 'spiderverse';

const THEME_STORAGE_KEY = 'deutschpfad_theme_mode';

export function getSavedThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'spiderverse' ? 'spiderverse' : 'polished';
  } catch {
    return 'polished';
  }
}

async function syncAndroidStatusBar(mode: ThemeMode): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (mode === 'spiderverse') {
      await StatusBar.setStyle({ style: Style.Dark });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#050505' });
      }
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#FAF8F5' });
      }
    }
  } catch {
    // Gracefully ignore if StatusBar plugin is unavailable
  }
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'polished',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getSavedThemeMode());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
    void syncAndroidStatusBar(theme);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'polished' ? 'spiderverse' : 'polished'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
