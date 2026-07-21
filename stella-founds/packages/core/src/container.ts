import { IndexedDbAdapter, COLLECTIONS } from './storage/IndexedDbAdapter';
import { SyncingStorageAdapter } from './storage/SyncingStorageAdapter';
import type { StorageAdapter } from './storage/StorageAdapter';
import {
  FinanceEntryRepository,
  FinanceCategoryRepository,
  FinanceNucleusRepository,
  RecurringRuleRepository,
  CalendarFinanceMarkRepository,
} from './repositories';
import { FinanceService, HomeSummaryService, RecurrenceService, ReportService } from './services';
import { WebExportAdapter, WebNotificationAdapter, WebPlatformAdapter } from './platform';
import { SyncEngine, NoopCloudAdapter, AuthController, LocalAuthRepository, EngineSyncRepository } from './sync';
import type { CloudAdapter } from './sync';

/**
 * @param baseStorage defaults to IndexedDbAdapter; pass a different StorageAdapter (e.g. an in-memory fake) to reuse the same repositories/services on another platform.
 * @param cloudAdapter defaults to NoopCloudAdapter (no backend wired yet); pass a real one (Supabase, etc.) once available — nothing else in this function changes.
 */
export function createContainer(baseStorage: StorageAdapter = new IndexedDbAdapter(), cloudAdapter: CloudAdapter = new NoopCloudAdapter()) {
  const syncEngine = new SyncEngine(baseStorage, cloudAdapter, COLLECTIONS);
  // Repositories get the syncing decorator; the engine itself reads/writes
  // through baseStorage directly (pulled remote changes must never
  // re-enqueue themselves as if they were a new local edit).
  const storage: StorageAdapter = new SyncingStorageAdapter(baseStorage, syncEngine);

  const authController = new AuthController(new LocalAuthRepository());
  const syncRepository = new EngineSyncRepository(syncEngine);

  const financeEntryRepository = new FinanceEntryRepository(storage);
  const financeCategoryRepository = new FinanceCategoryRepository(storage);
  const financeNucleusRepository = new FinanceNucleusRepository(storage);
  const recurringRuleRepository = new RecurringRuleRepository(storage);
  const calendarFinanceMarkRepository = new CalendarFinanceMarkRepository(storage);

  const financeService = new FinanceService(financeEntryRepository, calendarFinanceMarkRepository);
  const homeSummaryService = new HomeSummaryService(financeEntryRepository);
  const recurrenceService = new RecurrenceService(
    recurringRuleRepository,
    financeEntryRepository,
    calendarFinanceMarkRepository,
  );
  const reportService = new ReportService(financeEntryRepository);

  const platformAdapter = new WebPlatformAdapter();
  const notificationAdapter = new WebNotificationAdapter();
  const exportAdapter = new WebExportAdapter();

  return {
    storage,
    financeEntryRepository,
    financeCategoryRepository,
    financeNucleusRepository,
    recurringRuleRepository,
    calendarFinanceMarkRepository,
    financeService,
    homeSummaryService,
    recurrenceService,
    reportService,
    platformAdapter,
    notificationAdapter,
    exportAdapter,
    syncEngine,
    syncRepository,
    authController,
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
