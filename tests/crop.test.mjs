import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const geometry = source.slice(source.indexOf('  function cropGeometry()'), source.indexOf('  function drawCrop()'));

test('crop geometry allows default pan without exposing empty edges, for all photo orientations', () => {
  for (const [naturalWidth, naturalHeight] of [[600,1200],[1200,600],[1200,1200]]) {
    for (const width of [257.5,320,510]) {
      for (const zoom of [1,1.5,3]) {
        for (const x of [0,50,100]) for (const y of [0,50,100]) {
          const g = runInNewContext(`${geometry}; cropGeometry()`, {
            cropViewport: { getBoundingClientRect: () => ({ width }) },
            cropImage: { naturalWidth, naturalHeight }, cropState: { zoom, x, y },
          });
          assert.equal(g.width, g.height);
          assert.ok(g.imageWidth - width > .5);
          assert.ok(g.imageHeight - width > .5);
          assert.ok(g.left <= 0 && g.top <= 0);
          assert.ok(g.left + g.imageWidth >= width - 1e-8);
          assert.ok(g.top + g.imageHeight >= width - 1e-8);
          // Exported source rectangle must remain inside the original image.
          assert.ok((-g.left + width) / g.scale <= naturalWidth + 1e-8);
          assert.ok((-g.top + width) / g.scale <= naturalHeight + 1e-8);
        }
      }
    }
  }
});

test('crop position remains identical relative to original pixels after viewport resize', () => {
  const rects = [257.5,510].map(width => {
    const g = runInNewContext(`${geometry}; cropGeometry()`, {
      cropViewport: { getBoundingClientRect: () => ({ width }) },
      cropImage: { naturalWidth: 900, naturalHeight: 1600 },
      cropState: { zoom: 1.37, x: 72, y: 19 },
    });
    return [-g.left/g.scale, -g.top/g.scale, g.width/g.scale];
  });
  rects[0].forEach((value, i) => assert.ok(Math.abs(value - rects[1][i]) < 1e-8));
});
