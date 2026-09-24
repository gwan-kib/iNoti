import { expect, it } from 'vitest';
import { pipDimensionsInPixels } from '../src/shared/pip-dimensions';

it.each([
  [16, 200, 88],
  [20, 250, 110],
  [24, 300, 132],
  [0, 200, 88],
  [NaN, 200, 88],
])('converts root size %s to valid integer window dimensions', (root, width, height) => {
  expect(pipDimensionsInPixels(root)).toEqual({ width, height });
});
