import { useEffect, useState } from 'react';
import {
  useAppContainer,
  onFinanceChanged,
  type FinanceCategory,
  type FinanceEntry,
  type FinanceNucleus,
} from '@stella-founds/core';

export function useBillsData() {
  const { financeEntryRepository, financeCategoryRepository, financeNucleusRepository } = useAppContainer();
  const [entries, setEntries] = useState<FinanceEntry[] | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [nuclei, setNuclei] = useState<FinanceNucleus[]>([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      financeEntryRepository.list().then((result) => {
        if (!cancelled) setEntries(result);
      });
    }
    load();
    financeCategoryRepository.list().then((result) => !cancelled && setCategories(result));
    financeNucleusRepository.list().then((result) => !cancelled && setNuclei(result));
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [financeEntryRepository, financeCategoryRepository, financeNucleusRepository]);

  return { entries, categories, nuclei };
}
