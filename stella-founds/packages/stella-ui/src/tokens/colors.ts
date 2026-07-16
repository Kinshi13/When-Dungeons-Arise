export const colors = {
  background: {
    primary: '#141a30',
    secondary: '#1c2440',
    astral: 'linear-gradient(180deg, #141a30 0%, #232c52 55%, #2e3a68 100%)',
  },
  surface: {
    glass: 'rgba(255, 255, 255, 0.06)',
    card: 'rgba(255, 255, 255, 0.08)',
    elevated: 'rgba(255, 255, 255, 0.12)',
    navigation: 'linear-gradient(180deg, rgba(17, 22, 42, 0.82) 0%, rgba(14, 18, 36, 0.94) 100%)',
  },
  text: {
    primary: '#f4f6ff',
    secondary: '#aab2d6',
    muted: 'rgba(170, 178, 214, 0.6)',
    inverse: '#141a30',
  },
  accent: {
    stella: '#6d8bff',
    gold: '#e8c988',
    lavender: '#b9a8ff',
  },
  status: {
    success: '#7fd8a6',
    warning: '#f0c56b',
    danger: '#f18d8d',
    info: '#6d8bff',
  },
  border: {
    subtle: 'rgba(232, 201, 136, 0.25)',
  },
} as const;
