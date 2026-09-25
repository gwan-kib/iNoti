// Shared rem footprint; browser window APIs still require numeric CSS pixels.
export const PIP_DIMENSIONS_REM = { width: 18, height: 8 } as const;

export function pipDimensionsInPixels(rootFontSize: number) {
  const size =
    Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16;
  return {
    width: Math.round(PIP_DIMENSIONS_REM.width * size),
    height: Math.round(PIP_DIMENSIONS_REM.height * size),
  };
}
