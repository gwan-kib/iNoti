import { expect, it } from 'vitest';
import { pipDimensionsInPixels } from '../src/shared/pip-dimensions';

it.each([
  [16, 288, 128],
  [20, 360, 160],
  [24, 432, 192],
  [0, 288, 128],
  [NaN, 288, 128],
])('converts root size %s to valid integer window dimensions', (root, width, height) => {
  expect(pipDimensionsInPixels(root)).toEqual({ width, height });
});
