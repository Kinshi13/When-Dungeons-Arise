import { IndexedDbAdapter } from './storage/IndexedDbAdapter';
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

/** @param storage defaults to IndexedDbAdapter; pass a different StorageAdapter (e.g. an in-memory fake) to reuse the same repositories/services on another platform. */
export function createContainer(storage: StorageAdapter = new IndexedDbAdapter()) {

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
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
