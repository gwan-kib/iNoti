import { expect, it } from 'vitest';
import { pipDimensionsInPixels } from '../src/shared/pip-dimensions';

it.each([
  [16, 160, 192],
  [20, 200, 240],
  [24, 240, 288],
  [0, 160, 192],
  [NaN, 160, 192],
])('converts root size %s to valid integer window dimensions', (root, width, height) => {
  expect(pipDimensionsInPixels(root)).toEqual({ width, height });
});
