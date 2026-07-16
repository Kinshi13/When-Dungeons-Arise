import { StellaIconButton } from '@stella-founds/stella-ui';
import { useGlobalCalculator } from '../features/calculator/GlobalCalculatorProvider';
import './Header.css';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

/** Reused across Desktop and Tablet layouts (Mobile keeps its own compact ScreenShell header, same as Android). */
export function Header() {
  const now = new Date();
  const { toggleCalculator } = useGlobalCalculator();

  return (
    <div className="stella-header">
      <div className="stella-header__identity">
        <span className="stella-header__logo" aria-hidden="true">✦ Stella Founds</span>
        <span className="stella-header__greeting">
          {greetingForHour(now.getHours())} · {dateFormatter.format(now)}
        </span>
      </div>
      <div className="stella-header__actions">
        <input className="stella-header__search" type="search" placeholder="Pesquisar (em breve)" disabled />
        <StellaIconButton icon="🖩" label="Calculadora (Alt+C)" onClick={toggleCalculator} />
        <span className="stella-header__avatar" aria-hidden="true">🌙</span>
      </div>
    </div>
  );
}
