import { expect, it } from 'vitest';
import { pipDimensionsInPixels } from '../src/shared/pip-dimensions';

it.each([
  [16, 160, 160],
  [20, 200, 200],
  [24, 240, 240],
  [0, 160, 160],
  [NaN, 160, 160],
])('converts root size %s to valid integer window dimensions', (root, width, height) => {
  expect(pipDimensionsInPixels(root)).toEqual({ width, height });
});
