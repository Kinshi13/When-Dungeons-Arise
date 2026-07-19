import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAppContainer,
  onFinanceChanged,
  type FinanceCategory,
  type FinanceEntry,
  type FinanceNucleus,
} from '@stella-founds/core';
import { logError } from '../../lib/logError';

export interface BillsDataState {
  entries: FinanceEntry[] | null;
  categories: FinanceCategory[];
  nuclei: FinanceNucleus[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  reload: () => void;
}

export function useBillsData(): BillsDataState {
  const { financeEntryRepository, financeCategoryRepository, financeNucleusRepository } = useAppContainer();
  const [entries, setEntries] = useState<FinanceEntry[] | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [nuclei, setNuclei] = useState<FinanceNucleus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = useRef(false);
  const cancelledRef = useRef(false);

  const load = useCallback(() => {
    if (hasLoadedOnce.current) setIsRefreshing(true);
    else setIsLoading(true);

    Promise.all([
      financeEntryRepository.list(),
      financeCategoryRepository.list(),
      financeNucleusRepository.list(),
    ])
      .then(([entryResult, categoryResult, nucleusResult]) => {
        if (cancelledRef.current) return;
        setEntries(entryResult);
        setCategories(categoryResult);
        setNuclei(nucleusResult);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelledRef.current) return;
        logError('useBillsData', err);
        setError(err instanceof Error ? err : new Error('Failed to load bills data'));
      })
      .finally(() => {
        if (cancelledRef.current) return;
        hasLoadedOnce.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [financeEntryRepository, financeCategoryRepository, financeNucleusRepository]);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelledRef.current = true;
      unsubscribe();
    };
  }, [load]);

  return { entries, categories, nuclei, isLoading, isRefreshing, error, reload: load };
}
