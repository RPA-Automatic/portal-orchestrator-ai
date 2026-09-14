import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseTheme, resolveTheme} from '../src/lib/theme.ts';

test('preferência inválida segue o sistema; escolha explícita tem prioridade', () => {
  for (const value of [null, '', 'orange', 'system']) assert.equal(parseTheme(value), 'system');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('tema antes do primeiro paint coincide com o React e tolera storage bloqueado', () => {
  const source = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
  for (const saved of ['light', 'dark', 'system', 'invalid', null]) {
    for (const systemDark of [true, false]) {
      for (const blocked of [true, false]) {
        const root = {dataset:{}, style:{}, classList:{toggle(name, enabled) {this[name] = enabled;}}};
        const meta = {};
        runInNewContext(source, {
          localStorage: {getItem() {if (blocked) throw new Error('Blocked'); return saved;}},
          window: {matchMedia: () => ({matches: systemDark})},
          document: {documentElement: root, querySelector: () => meta},
        });
        const expected = resolveTheme(blocked ? 'system' : parseTheme(saved), systemDark);
        assert.equal(root.dataset.theme, expected);
        assert.equal(root.style.colorScheme, expected);
        assert.equal(root.classList.dark, expected === 'dark');
        assert.equal(meta.content, expected === 'dark' ? '#0b1120' : '#f5f7fc');
      }
    }
  }
});
