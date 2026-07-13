import { IndexedDbAdapter } from './storage/IndexedDbAdapter';
import {
  FinanceEntryRepository,
  FinanceCategoryRepository,
  FinanceNucleusRepository,
  RecurringRuleRepository,
  CalendarFinanceMarkRepository,
} from './repositories';
import { FinanceService } from './services';

export function createContainer() {
  const storage = new IndexedDbAdapter();

  const financeEntryRepository = new FinanceEntryRepository(storage);
  const financeCategoryRepository = new FinanceCategoryRepository(storage);
  const financeNucleusRepository = new FinanceNucleusRepository(storage);
  const recurringRuleRepository = new RecurringRuleRepository(storage);
  const calendarFinanceMarkRepository = new CalendarFinanceMarkRepository(storage);

  const financeService = new FinanceService(financeEntryRepository, calendarFinanceMarkRepository);

  return {
    storage,
    financeEntryRepository,
    financeCategoryRepository,
    financeNucleusRepository,
    recurringRuleRepository,
    calendarFinanceMarkRepository,
    financeService,
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
