import { createContainer, type AppContainer } from '@stella-founds/core';
import { FakeStorageAdapter } from './FakeStorageAdapter';
import { fakeCategories, fakeFinanceEntries, fakeNuclei } from './fakeSeed';

/**
 * Builds the same AppContainer shape Android uses (same repositories,
 * same services from @stella-founds/core), but backed by an in-memory
 * fake StorageAdapter pre-populated with placeholder data instead of
 * IndexedDB. No backend, no fetch — proves the shared Core works
 * unmodified on Web.
 */
export function createWebContainer(): AppContainer {
  const storage = new FakeStorageAdapter();
  storage.seed('financeCategories', fakeCategories);
  storage.seed('financeNuclei', fakeNuclei);
  storage.seed('financeEntries', fakeFinanceEntries);

  return createContainer(storage);
}
