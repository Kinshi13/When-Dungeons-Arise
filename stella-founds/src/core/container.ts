import { IndexedDbAdapter } from './storage/IndexedDbAdapter';
import {
  FinanceEntryRepository,
  FinanceCategoryRepository,
  FinanceNucleusRepository,
  RecurringRuleRepository,
  CalendarFinanceMarkRepository,
} from './repositories';
import { FinanceService, HomeSummaryService } from './services';

export function createContainer() {
  const storage = new IndexedDbAdapter();

  const financeEntryRepository = new FinanceEntryRepository(storage);
  const financeCategoryRepository = new FinanceCategoryRepository(storage);
  const financeNucleusRepository = new FinanceNucleusRepository(storage);
  const recurringRuleRepository = new RecurringRuleRepository(storage);
  const calendarFinanceMarkRepository = new CalendarFinanceMarkRepository(storage);

  const financeService = new FinanceService(financeEntryRepository, calendarFinanceMarkRepository);
  const homeSummaryService = new HomeSummaryService(financeEntryRepository);

  return {
    storage,
    financeEntryRepository,
    financeCategoryRepository,
    financeNucleusRepository,
    recurringRuleRepository,
    calendarFinanceMarkRepository,
    financeService,
    homeSummaryService,
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
