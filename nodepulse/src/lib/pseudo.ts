/** Deterministic pseudo-random helpers so the demo never changes on re-render. */

export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

/** Stable value in the [0, 1) range derived from a seed and index. */
export function noise(seed: number, index: number): number {
  const x = Math.sin(seed * 0.0001 + index * 78.233 + 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Deterministic offset in the [-1, 1] range. */
export function signedNoise(seed: number, index: number): number {
  return noise(seed, index) * 2 - 1;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
