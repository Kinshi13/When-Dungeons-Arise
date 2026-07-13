export interface ParallaxLayerConfig {
  id: string;
  offsetPx: number;
}

export const parallaxLayers: ParallaxLayerConfig[] = [
  { id: 'sky-gradient', offsetPx: 1 },
  { id: 'distant-stars', offsetPx: 2 },
  { id: 'constellation-lines', offsetPx: 4 },
  { id: 'soft-orbits', offsetPx: 6 },
  { id: 'foreground-glow', offsetPx: 8 },
  { id: 'subtle-particles', offsetPx: 10 },
];
