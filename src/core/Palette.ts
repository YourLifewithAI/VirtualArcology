/**
 * Single source of truth for every color in the app.
 * Warm solarpunk palette: timber + cream + leaf greens broken by
 * solar blue and industrial grays, with a few emissive accents.
 */
const BASE = {
  // organic / residential
  timber: 0xb08653,
  timberDark: 0x8a6642,
  cream: 0xefe6d5,
  creamDark: 0xd9cdb8,
  terracotta: 0xc4704f,
  leaf: 0x7fb069,
  leafDark: 0x3f7a3a,
  leafLight: 0xa4c98a,
  grass: 0x8fb96e,
  soil: 0x8a6f4d,
  bark: 0x6e5236,

  // hard surfaces
  concrete: 0xb9b7b2,
  concreteDark: 0x8d8b86,
  asphalt: 0x4d5157,
  path: 0xd9cfb8,
  paver: 0xc9c2b2,
  paverDark: 0xb3aa96,

  // industry / tech
  industryWhite: 0xe8e6e1,
  steel: 0x9aa3ad,
  steelDark: 0x5f6a75,
  charcoal: 0x33383f,
  solar: 0x2c4f74,
  solarDark: 0x1e3a58,
  safetyAmber: 0xe8b23a,
  hazardRed: 0xc94f38,
  pipe: 0xc0c8d0,
  copper: 0xb87348,

  // water / glass
  glassTint: 0xbfe3e0,
  water: 0x5fa8c9,
  waterDeep: 0x3d7fa3,

  // accents & emissives
  growMagenta: 0xff5fa2,
  growWarm: 0xffd9a0,
  windowLit: 0xffd98c,
  windowDark: 0x2e3d4d,
  robotTeal: 0x2aa9a0,
  medGreen: 0x4fae7a,
  beaconRed: 0xff4444,
  canvasRed: 0xc95f4d,
  canvasTeal: 0x4d9e97,
  canvasYellow: 0xdfae53,
  white: 0xf4f2ee,

  // arcology programs
  progIndustrial: 0x8d8b86,
  progResidential: 0xe4d7bd,
  progMixed: 0xc9b291,
  progAgriculture: 0x7fb069,
  progCompute: 0x5a7fb5,
  progSpire: 0xa9c1d9,

  // sky / environment
  sky: 0xbfe0f5,
  skyHorizon: 0xe8f2f8,
  cloud: 0xffffff,
  prairie: 0x9dae6e,
  prairieDry: 0xbcb87a,
} as const;

export type ColorName = keyof typeof BASE;

/**
 * The live palette. Module builders bake these values into vertex colors at
 * build time, so switching themes = applyTheme() + rebuilding placed modules.
 */
export const PALETTE: Record<ColorName, number> = { ...BASE };

/** Architectural themes: palette overrides on top of the solarpunk base. */
export const THEMES: Record<string, Partial<Record<ColorName, number>>> = {
  solarpunk: {},
  'desert-adobe': {
    timber: 0xb5734a, timberDark: 0x94582f, cream: 0xe8d5b0, creamDark: 0xcdb98f,
    terracotta: 0xb35733, leaf: 0x8a9a5b, leafDark: 0x5c6b3c, leafLight: 0xa8b26e,
    grass: 0xc2b280, soil: 0xb08968, paver: 0xd9c7a0, paverDark: 0xc0ab85, path: 0xe3d3ac,
    concrete: 0xcbb999, concreteDark: 0xa8946f, canvasRed: 0xa8442e, canvasTeal: 0x3f7d78,
    canvasYellow: 0xd9a441, sky: 0xd5e2e8, skyHorizon: 0xf2e5c9, prairie: 0xd2b98b,
    prairieDry: 0xdccca0, water: 0x4f98b8, windowLit: 0xffc97a,
  },
  nordic: {
    timber: 0x4a3c30, timberDark: 0x33291f, cream: 0xf5f2ec, creamDark: 0xd8d4cb,
    terracotta: 0x93392e, leaf: 0x4f7350, leafDark: 0x2f4a33, leafLight: 0x7d9b7a,
    grass: 0x7d926b, soil: 0x5e5244, paver: 0xb9bcbd, paverDark: 0x9fa3a4, path: 0xcccdc9,
    concrete: 0xaeb2b3, concreteDark: 0x84898b, canvasRed: 0x93392e, canvasTeal: 0x40606b,
    canvasYellow: 0xc7a552, sky: 0xcfdde8, skyHorizon: 0xe8eef2, prairie: 0x8ba07a,
    prairieDry: 0xa3b18e, water: 0x4a7f9b, glassTint: 0xc4dbe2,
  },
  'neon-night': {
    timber: 0x2f3640, timberDark: 0x232a33, cream: 0x3a4048, creamDark: 0x2c3138,
    terracotta: 0x5b3644, leaf: 0x2e5d46, leafDark: 0x1d3d2e, leafLight: 0x3f7a5c,
    grass: 0x24383a, soil: 0x2a2622, bark: 0x241f19, paver: 0x2e343c, paverDark: 0x262b32,
    path: 0x39404a, asphalt: 0x14181e, concrete: 0x3d434c, concreteDark: 0x2a2f36,
    industryWhite: 0x494f58, steel: 0x555e6a, steelDark: 0x3a424c, charcoal: 0x1a1f26,
    solar: 0x1f3a5f, solarDark: 0x152a46, glassTint: 0x3b6f80, water: 0x2a6f8f,
    waterDeep: 0x1d5068, windowLit: 0xffd166, windowDark: 0x1a2430, growMagenta: 0xff4fd8,
    growWarm: 0xffb35c, robotTeal: 0x25f4e0, safetyAmber: 0xffb340, hazardRed: 0xff4f6d,
    canvasRed: 0xff4f6d, canvasTeal: 0x2ee6d6, canvasYellow: 0xffe14f, medGreen: 0x37e0a0,
    sky: 0x0d1220, skyHorizon: 0x1a2238, cloud: 0x2a3346, prairie: 0x1c2426, prairieDry: 0x232c2b,
    white: 0x4d545e,
  },
  mediterranean: {
    timber: 0xdccbb0, timberDark: 0xb9a684, cream: 0xf7f3ea, creamDark: 0xe2dccc,
    terracotta: 0xc96f4a, leaf: 0x71955c, leafDark: 0x49663c, leafLight: 0x9ab77f,
    grass: 0xa4ad72, soil: 0xa38a66, paver: 0xe6ddc8, paverDark: 0xcfc4a8, path: 0xefe7d2,
    concrete: 0xd6cfbc, concreteDark: 0xb3ab95, solar: 0x2a5d8f, glassTint: 0xa9d6e5,
    canvasRed: 0xc2543f, canvasTeal: 0x2a7f9e, canvasYellow: 0xe0b64f, robotTeal: 0x1f8a9e,
    sky: 0xbfe3f5, skyHorizon: 0xeaf4f8, prairie: 0xa8b06e, prairieDry: 0xc4bd85,
    water: 0x3f9ecf, waterDeep: 0x2b7aa8,
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export const THEME_LABELS: Record<string, string> = {
  solarpunk: 'Solarpunk (Texas timber)',
  'desert-adobe': 'Desert Adobe',
  nordic: 'Nordic Timber',
  'neon-night': 'Neon Night',
  mediterranean: 'Mediterranean',
};

/** Per-theme lighting environment. */
export const THEME_ENV: Record<string, { sun: number; hemi: number; sunColor: number }> = {
  solarpunk: { sun: 2.2, hemi: 0.9, sunColor: 0xfff2dd },
  'desert-adobe': { sun: 2.6, hemi: 0.85, sunColor: 0xffe9c4 },
  nordic: { sun: 1.6, hemi: 1.0, sunColor: 0xf2f4f8 },
  'neon-night': { sun: 0.35, hemi: 0.3, sunColor: 0x8fa8ff },
  mediterranean: { sun: 2.5, hemi: 0.95, sunColor: 0xfff6e0 },
};

export function applyTheme(name: string): void {
  Object.assign(PALETTE, BASE, THEMES[name] ?? {});
}
