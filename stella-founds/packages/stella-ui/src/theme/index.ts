import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';
import { elevation } from '../tokens/elevation';
import { shadows } from '../tokens/shadows';
import { glass } from '../tokens/glass';
import { duration, easing, stagger } from '../tokens/motion';
import { breakpoints } from '../tokens/breakpoints';
import { zIndex } from '../tokens/zIndex';

export * from '../tokens';

/** Single object view over every design token, for consumers that prefer `stellaTheme.colors.text.primary` over named imports. */
export const stellaTheme = {
  colors,
  spacing,
  radius,
  typography,
  elevation,
  shadows,
  glass,
  motion: { duration, easing, stagger },
  breakpoints,
  zIndex,
} as const;
