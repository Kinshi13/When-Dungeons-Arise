import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StellaEmptyState, StellaButton } from '@stella-founds/stella-ui';
import { logError } from '../lib/logError';
import './AppErrorBoundary.css';

interface State {
  hasError: boolean;
}

/**
 * Catches render errors anywhere below it so a bug in one screen shows a
 * calm Stella-branded fallback instead of a blank white page. Class
 * component because error boundaries have no hook equivalent in React.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('AppErrorBoundary', { error, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary">
          <StellaEmptyState
            title="Algo saiu do rumo"
            message="Um erro inesperado interrompeu esta tela. Você pode tentar recarregar."
          />
          <StellaButton variant="primary" onClick={() => window.location.reload()}>
            Recarregar
          </StellaButton>
        </div>
      );
    }

    return this.props.children;
  }
}
