import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const script = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const update = script.slice(script.indexOf('  function updateMaximumAgeOptions()'), script.indexOf('  preferredAgeMin.addEventListener'));

test('maximum age excludes lower choices and preserves only valid previous selections', () => {
  for (const [minimum, previous, expected] of [['30','25',''],['30','35','35'],['40','40','40'],['','25','25'],['20','','']]) {
    const maximum = {
      value: previous, options: [],
      replaceChildren(option) { this.options = [option]; },
      add(option) { this.options.push(option); },
      setCustomValidity() {},
    };
    runInNewContext(`${update}; updateMaximumAgeOptions()`, {
      preferredAgeMin: { value: minimum }, preferredAgeMax: maximum,
      Option: function(text, value) { return { text, value }; },
    });
    assert.equal(maximum.value, expected);
    assert.deepEqual(maximum.options.slice(1).map(o => Number(o.value)),
      Array.from({ length: 41 - (Number(minimum) || 20) }, (_, i) => (Number(minimum) || 20) + i));
  }
});
