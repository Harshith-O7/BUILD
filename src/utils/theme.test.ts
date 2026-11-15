import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseThemeMode,
  THEME_STORAGE_KEY,
  toggleThemeMode,
} from './theme';

test('parseThemeMode resolves dark and defaults safely to light (white) mode', () => {
  assert.equal(parseThemeMode('dark'), 'dark');
  assert.equal(parseThemeMode('light'), 'light');
  assert.equal(parseThemeMode(null), 'light');
  assert.equal(parseThemeMode(undefined), 'light');
  assert.equal(parseThemeMode('unknown'), 'light');
  assert.equal(THEME_STORAGE_KEY, 'buildgrid_theme_mode_v1');
});

test('toggleThemeMode switches cleanly between light and dark', () => {
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'light');
});
