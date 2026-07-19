import { StellaBottomSheet, StellaDrawer, StellaFloatingPanel, StellaCalculator, useBreakpoint } from '@stella-founds/stella-ui';
import { useGlobalCalculator } from './GlobalCalculatorProvider';

/**
 * Renders the single global calculator instance with the chrome appropriate
 * to the current breakpoint: bottom sheet (mobile, swipe-to-close already
 * built into StellaBottomSheet), right-side drawer (tablet, reusing the
 * same StellaDrawer as the summary panel), or a draggable/minimizable
 * floating panel (desktop) that stays mounted across route changes.
 */
export function GlobalCalculatorHost() {
  const breakpoint = useBreakpoint();
  const { engine, isOpen, onUseResult, closeCalculator } = useGlobalCalculator();

  if (!isOpen) return null;

  function handleUseResult(value: number) {
    onUseResult?.(value);
    closeCalculator();
  }

  const content = <StellaCalculator engine={engine} onUseResult={onUseResult ? handleUseResult : undefined} />;

  if (breakpoint === 'mobile') {
    return (
      <StellaBottomSheet title="Calculadora" onClose={closeCalculator}>
        {content}
      </StellaBottomSheet>
    );
  }

  if (breakpoint === 'tablet') {
    return (
      <StellaDrawer label="Calculadora" onClose={closeCalculator}>
        {content}
      </StellaDrawer>
    );
  }

  return (
    <StellaFloatingPanel title="Calculadora" onClose={closeCalculator} persistKey="stella-calculator-panel">
      {content}
    </StellaFloatingPanel>
  );
}
