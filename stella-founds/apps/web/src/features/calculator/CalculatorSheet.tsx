import { Modal, StellaBottomSheet, StellaCalculator, useBreakpoint } from '@stella-founds/stella-ui';

/** Stella Core "Calculadora" action: a simple standalone four-operation calculator. */
export function CalculatorSheet({ onClose }: { onClose: () => void }) {
  const breakpoint = useBreakpoint();
  const content = <StellaCalculator />;

  if (breakpoint === 'mobile') {
    return (
      <StellaBottomSheet title="Calculadora" onClose={onClose}>
        {content}
      </StellaBottomSheet>
    );
  }

  return (
    <Modal title="Calculadora" onClose={onClose}>
      {content}
    </Modal>
  );
}
