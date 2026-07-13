import { IndexedDbAdapter } from './storage/IndexedDbAdapter';
import {
  FinanceEntryRepository,
  FinanceCategoryRepository,
  FinanceNucleusRepository,
  RecurringRuleRepository,
  CalendarFinanceMarkRepository,
} from './repositories';
import { FinanceService, HomeSummaryService, RecurrenceService, ReportService } from './services';

export function createContainer() {
  const storage = new IndexedDbAdapter();

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
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
