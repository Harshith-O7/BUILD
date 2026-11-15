export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'buildgrid_theme_mode_v1';

export function parseThemeMode(raw?: string | null): ThemeMode {
  return raw === 'dark' ? 'dark' : 'light';
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

export function loadStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

export function saveStoredTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}
