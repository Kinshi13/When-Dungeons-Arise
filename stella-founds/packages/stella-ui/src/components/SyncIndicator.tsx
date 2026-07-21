import type { SyncStatusSnapshot } from '@stella-founds/core';
import './SyncIndicator.css';

// Exactly the five words from the Fase 7 brief — short on purpose, this is
// a discreet chip, not a status report.
const LABEL: Record<SyncStatusSnapshot['status'], string> = {
  synced: 'Sincronizado',
  syncing: 'Sincronizando',
  offline: 'Offline',
  error: 'Erro',
  pending: 'Pendente',
};

const TITLE: Record<SyncStatusSnapshot['status'], string> = {
  synced: 'Tudo sincronizado',
  syncing: 'Sincronizando alterações…',
  offline: 'Offline — alterações salvas neste dispositivo',
  error: 'Erro ao sincronizar — tentando novamente',
  pending: 'Aguardando conexão com a nuvem',
};

/**
 * A single quiet dot — never a banner, never a spinner competing with the
 * rest of the interface. It answers "is my data safe?" without ever
 * demanding attention, matching every other discreet state in Stella
 * (hover glows, empty-state stardust): opacity and a small color shift,
 * nothing else. Fase 7 section 6 — the states are Sincronizado /
 * Sincronizando / Offline / Erro / Pendente.
 */
export function SyncIndicator({ status }: { status: SyncStatusSnapshot }) {
  return (
    <span className={`sync-indicator sync-indicator--${status.status}`} title={TITLE[status.status]} aria-live="polite">
      <span className="sync-indicator__dot" aria-hidden="true" />
      <span className="sync-indicator__label">{LABEL[status.status]}</span>
    </span>
  );
}
