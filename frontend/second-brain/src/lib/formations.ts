// src/lib/formations.ts
//
// Procedural point-cloud generators for the six NOVA formations. Each
// returns a flat Float32Array of positions plus per-particle delay/size
// attributes that ParticleUniverse.tsx binds straight onto the geometry.
//
// Delay values are derived from a spatial axis (+ a little jitter) rather
// than pure per-particle randomness — a random delay reads as a sparkle/
// dissolve; a spatially-correlated one reads as a wave sweeping through
// the cloud, which is what "sweeps like a liquid" in the brief means.

export const PARTICLE_COUNT = 90000;
export const PARTICLE_COUNT_MOBILE = 32000;

export interface Formation {
  positions: Float32Array;
  delays: Float32Array;
  sizes: Float32Array;
}

function makeSizes(count: number): Float32Array {
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    sizes[i] = 0.3 + Math.pow(Math.random(), 2.6) * 1.5;
  }
  return sizes;
}

export function makeRandomsForCount(count: number): Float32Array {
  const r = new Float32Array(count);
  for (let i = 0; i < count; i++) r[i] = Math.random();
  return r;
}

function delaysFromAxis(
  count: number,
  axisValue: (i: number) => number,
  jitter = 0.15
): Float32Array {
  const d = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    d[i] = Math.min(1, Math.max(0, axisValue(i) + (Math.random() - 0.5) * jitter));
  }
  return d;
}

/* ── 1. Orb — Fibonacci-sphere distribution (even coverage, reads as a
 * "dotted latitude" globe), slight radial jitter so it's a cloud, not a
 * rigid shell. Sweep axis: top → bottom, matching the crown/base color law. */
export function makeOrb(count: number): Formation {
  const positions = new Float32Array(count * 3);
  const RADIUS = 3.2;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / count) * 2; // 1 → -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN * i;
    const jitter = 1 + (Math.random() - 0.5) * 0.04;

    positions[i * 3]     = Math.cos(theta) * r * RADIUS * jitter;
    positions[i * 3 + 1] = y * RADIUS * jitter;
    positions[i * 3 + 2] = Math.sin(theta) * r * RADIUS * jitter;
  }

  const delays = delaysFromAxis(count, (i) => 1 - i / count);
  return { positions, delays, sizes: makeSizes(count) };
}

/* ── 2. Hourglass — sphere pinched at the equator ── */
export function makeHourglass(count: number): Formation {
  const positions = new Float32Array(count * 3);
  const HEIGHT = 4.2;

  for (let i = 0; i < count; i++) {
    const y = (Math.random() * 2 - 1) * (HEIGHT / 2);
    const yN = Math.abs(y) / (HEIGHT / 2); // 0 at equator, 1 at poles
    const pinch = 0.12 + Math.pow(yN, 1.6);
    const radius = pinch * 2.6;
    const theta = Math.random() * Math.PI * 2;
    const rJitter = Math.sqrt(Math.random());

    positions[i * 3]     = Math.cos(theta) * radius * rJitter;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * radius * rJitter;
  }

  const delays = delaysFromAxis(count, () => Math.random(), 1.0);
  return { positions, delays, sizes: makeSizes(count) };
}

/* ── 3. Helix — DNA double strand + connecting rungs ── */
export function makeHelix(count: number): Formation {
  const positions = new Float32Array(count * 3);
  const HEIGHT = 9;
  const RADIUS = 1.6;
  const TURNS = 4.5;

  const rungCount = Math.floor(count * 0.18);
  const strandCount = count - rungCount;

  for (let i = 0; i < strandCount; i++) {
    const strand = i % 2;
    const t = i / strandCount;
    const y = (t - 0.5) * HEIGHT;
    const angle = t * Math.PI * 2 * TURNS + strand * Math.PI;

    positions[i * 3]     = Math.cos(angle) * RADIUS;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * RADIUS;
  }

  for (let j = 0; j < rungCount; j++) {
    const i = strandCount + j;
    const t = j / rungCount;
    const y = (t - 0.5) * HEIGHT;
    const angle = t * Math.PI * 2 * TURNS;
    const along = Math.random() * 2 - 1;

    positions[i * 3]     = Math.cos(angle) * RADIUS * along;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * RADIUS * along;
  }

  const delays = delaysFromAxis(count, (i) => (i % strandCount) / strandCount);
  return { positions, delays, sizes: makeSizes(count) };
}

/* ── 4. Terrain — ridged mountain grid. Kept flat/grid-aligned since the
 * shader weights spin to zero for this formation. ── */
export function makeTerrain(count: number): Formation {
  const positions = new Float32Array(count * 3);
  const SIZE = 9;
  const side = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < count; i++) {
    const gx = i % side;
    const gz = Math.floor(i / side);
    const x = (gx / side - 0.5) * SIZE;
    const z = (gz / side - 0.5) * SIZE;

    const ridge = (v: number) => 1 - Math.abs(Math.sin(v));
    const h =
      ridge(x * 0.7 + z * 0.3) * 1.4 +
      ridge(x * 1.6 - z * 0.9) * 0.7 +
      ridge(x * 0.35 * z * 0.35) * 0.5;

    positions[i * 3]     = x;
    positions[i * 3 + 1] = h - 1.6;
    positions[i * 3 + 2] = z;
  }

  const delays = delaysFromAxis(count, (i) => Math.floor(i / side) / side);
  return { positions, delays, sizes: makeSizes(count) };
}

/* ── 5. Black hole — thin accretion disk, hollow core ── */
export function makeBlackHole(count: number): Formation {
  const positions = new Float32Array(count * 3);
  const INNER = 1.4;
  const OUTER = 5.2;

  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const r = INNER + (OUTER - INNER) * Math.sqrt(t);
    const angle = Math.random() * Math.PI * 2;
    const thickness = (1 - (r - INNER) / (OUTER - INNER)) * 0.35;
    const y = (Math.random() - 0.5) * thickness;

    positions[i * 3]     = Math.cos(angle) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  const delays = delaysFromAxis(count, (i) => {
    const dx = positions[i * 3], dz = positions[i * 3 + 2];
    return Math.min(1, Math.sqrt(dx * dx + dz * dz) / OUTER);
  });
  return { positions, delays, sizes: makeSizes(count) };
}

/* ── 6. Galaxy — three-arm logarithmic spiral ── */
export function makeGalaxy(count: number): Formation {
  const positions = new Float32Array(count * 3);
  const ARMS = 3;
  const MAX_R = 6.5;
  const SPIRAL = 2.4;

  for (let i = 0; i < count; i++) {
    const arm = i % ARMS;
    const t = Math.pow(Math.random(), 0.6); // denser toward center
    const r = t * MAX_R;
    const spread = (Math.random() - 0.5) * (0.25 + t * 0.5);
    const angle = r * SPIRAL + (arm * (Math.PI * 2)) / ARMS + spread;
    const thickness = (0.15 + t * 0.4) * (Math.random() - 0.5);

    positions[i * 3]     = Math.cos(angle) * r;
    positions[i * 3 + 1] = thickness;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  const delays = delaysFromAxis(count, (i) => {
    const dx = positions[i * 3], dz = positions[i * 3 + 2];
    return Math.min(1, Math.sqrt(dx * dx + dz * dz) / MAX_R);
  });
  return { positions, delays, sizes: makeSizes(count) };
}