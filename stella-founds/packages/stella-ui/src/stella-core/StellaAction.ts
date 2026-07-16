import type { ReactNode } from 'react';

/** A single Stella Core menu action. No business/route logic lives here — the consuming app decides which actions exist and what `execute` does. */
export interface StellaAction {
  id: string;
  label: string;
  icon?: ReactNode;
  execute: () => void;
  disabled?: boolean;
  animationOrder?: number;
}
