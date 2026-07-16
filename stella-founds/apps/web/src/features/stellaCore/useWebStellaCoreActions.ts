import { useMemo } from 'react';
import type { StellaAction } from '@stella-founds/stella-ui';

/**
 * Web Fase 2 Stella Core actions — placeholders only, no finance logic yet.
 * `onPlaceholder` is called with the action's label so the app shell can
 * show a lightweight "em breve" notice instead of doing anything real.
 */
export function useWebStellaCoreActions(onPlaceholder: (label: string) => void): StellaAction[] {
  return useMemo<StellaAction[]>(
    () => [
      { id: 'new-bill', label: 'Nova conta', execute: () => onPlaceholder('Nova conta') },
      { id: 'new-subscription', label: 'Nova assinatura', execute: () => onPlaceholder('Nova assinatura') },
      { id: 'new-income', label: 'Recebimento', execute: () => onPlaceholder('Recebimento') },
      { id: 'calculator', label: 'Calculadora', execute: () => onPlaceholder('Calculadora') },
    ],
    [onPlaceholder],
  );
}
