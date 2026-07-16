import { useMemo } from 'react';
import type { StellaAction } from '@stella-founds/stella-ui';
import { actionToEntryType, getStellaCoreActionsForRoute, hasRealFinanceActions } from './stellaCoreActions';

export interface WebStellaCoreHandlers {
  pathname: string;
  openCreate: (entryTypeActionId: string) => void;
  openMarkPaid: () => void;
  openCalculator: () => void;
  onPlaceholder: (label: string) => void;
}

/**
 * Builds the Stella Core action list for the current route: real actions
 * (open the finance form / mark-paid picker / calculator) on Hoje and
 * Contas, placeholder actions elsewhere — same route-based shape Android
 * uses for its own Stella Core actions.
 */
export function useWebStellaCoreActions({
  pathname,
  openCreate,
  openMarkPaid,
  openCalculator,
  onPlaceholder,
}: WebStellaCoreHandlers): StellaAction[] {
  const configs = getStellaCoreActionsForRoute(pathname);
  const real = hasRealFinanceActions(pathname);

  return useMemo<StellaAction[]>(
    () =>
      configs.map((config) => ({
        id: config.id,
        label: config.label,
        execute: () => {
          if (config.id === 'calculator') {
            openCalculator();
            return;
          }
          if (!real) {
            onPlaceholder(config.label);
            return;
          }
          if (config.id === 'mark-paid') {
            openMarkPaid();
            return;
          }
          if (actionToEntryType[config.id]) {
            openCreate(config.id);
          }
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname],
  );
}
