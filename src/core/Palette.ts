/**
 * Single source of truth for every color in the app.
 * Warm solarpunk palette: timber + cream + leaf greens broken by
 * solar blue and industrial grays, with a few emissive accents.
 */
export const PALETTE = {
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

export type ColorName = keyof typeof PALETTE;
