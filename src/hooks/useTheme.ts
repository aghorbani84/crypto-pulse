import { useCallback, useEffect, useState } from 'react';

export type ThemeStyle = 'achaemenid' | 'modern';
export type ThemeMode = 'light' | 'dark';

const STYLE_KEY = 'showcase-style';
const MODE_KEY = 'showcase-mode';

function readStyle(): ThemeStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'achaemenid'
      ? 'achaemenid'
      : 'modern';
  } catch {
    return 'modern';
  }
}

function readMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* fall through to media query */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function useTheme() {
  const [style, setStyleState] = useState<ThemeStyle>(readStyle);
  const [mode, setModeState] = useState<ThemeMode>(readMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-style', style);
    try {
      localStorage.setItem(STYLE_KEY, style);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [style]);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [mode]);

  const setStyle = useCallback((next: ThemeStyle) => setStyleState(next), []);
  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { style, mode, setStyle, setMode, toggleMode, themeKey: `${style}-${mode}` };
}
