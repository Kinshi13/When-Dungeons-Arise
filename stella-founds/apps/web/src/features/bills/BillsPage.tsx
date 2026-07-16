import { useMemo, useState } from 'react';
import {
  useAppContainer,
  todayIso,
  applyFinanceEntryFilter,
  type FinanceEntry,
  type FinanceEntryFilter,
} from '@stella-founds/core';
import {
  ScreenShell,
  StellaConfirmDialog,
  StellaBottomSheet,
  StellaDrawer,
  useBreakpoint,
  showStellaToast,
  StellaParallax,
  BackgroundLayer,
  stellaParallaxScene,
} from '@stella-founds/stella-ui';
import { useBillsData } from './useBillsData';
import { BillsFiltersBar } from './BillsFiltersBar';
import { FinanceEntryList } from './FinanceEntryList';
import { FinanceEntryDetails } from './FinanceEntryDetails';
import { useFinanceDialog } from '../finance/FinanceDialogContext';
import './BillsPage.css';

const emptyMessages: Record<FinanceEntryFilter, { title: string; message: string }> = {
  all: { title: 'Nenhuma conta por enquanto', message: 'Seu céu financeiro está limpo.' },
  upcoming: { title: 'Nenhum vencimento por enquanto', message: 'Seu céu financeiro está limpo.' },
  toPay: { title: 'Nada a pagar', message: 'Você está em dia.' },
  paid: { title: 'Nenhuma conta paga ainda', message: 'Assim que pagar algo, aparece aqui.' },
  toReceive: { title: 'Nada a receber', message: 'Sem valores pendentes de recebimento.' },
  subscriptions: { title: 'Nenhuma assinatura', message: 'Suas assinaturas vão aparecer aqui.' },
  recurring: { title: 'Nenhum lançamento recorrente', message: 'Marque "repetir mensalmente" ao criar uma conta.' },
  overdue: { title: 'Nada vencido', message: 'Seu céu financeiro está limpo.' },
};

type ConfirmAction = { kind: 'cancel' | 'delete'; entry: FinanceEntry };

export function BillsPage() {
  const { financeService } = useAppContainer();
  const { openEdit } = useFinanceDialog();
  const breakpoint = useBreakpoint();
  const { entries, categories, nuclei } = useBillsData();
  const [filter, setFilter] = useState<FinanceEntryFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const nucleusMap = useMemo(() => new Map(nuclei.map((n) => [n.id, n])), [nuclei]);
  const today = todayIso();

  const filtered = useMemo(() => {
    if (!entries) return [];
    const notCancelled = entries.filter((entry) => entry.status !== 'cancelled');
    return applyFinanceEntryFilter(notCancelled, filter, today).sort((a, b) =>
      (a.dueDate ?? a.createdAt) < (b.dueDate ?? b.createdAt) ? -1 : 1,
    );
  }, [entries, filter, today]);

  const selectedEntry = entries?.find((entry) => entry.id === selectedId) ?? null;

  async function handleMarkSettled(entry: FinanceEntry) {
    if (busyId) return;
    setBusyId(entry.id);
    try {
      if (entry.type === 'income') {
        await financeService.markAsReceived(entry.id);
        showStellaToast(`"${entry.title}" marcada como recebida.`, 'success');
      } else {
        await financeService.markAsPaid(entry.id);
        showStellaToast(`"${entry.title}" marcada como paga.`, 'success');
      }
    } catch {
      showStellaToast('Não foi possível atualizar o lançamento.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmCancelOrDelete() {
    if (!confirmAction) return;
    const { kind, entry } = confirmAction;
    setConfirmAction(null);
    setBusyId(entry.id);
    try {
      if (kind === 'cancel') {
        await financeService.cancelEntry(entry.id);
        showStellaToast('Lançamento cancelado.', 'success');
      } else {
        await financeService.deleteEntry(entry.id);
        showStellaToast('Lançamento excluído.', 'success');
      }
      if (selectedId === entry.id) setSelectedId(null);
    } catch {
      showStellaToast('Não foi possível concluir a ação.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const empty = emptyMessages[filter];

  const list = !entries ? (
    <p>Carregando…</p>
  ) : (
    <FinanceEntryList
      entries={filtered}
      categoryMap={categoryMap}
      nucleusMap={nucleusMap}
      selectedId={selectedId ?? undefined}
      busyId={busyId}
      emptyTitle={empty.title}
      emptyMessage={empty.message}
      onSelect={(entry) => setSelectedId(entry.id)}
      onMarkSettled={handleMarkSettled}
      onEdit={openEdit}
      onCancel={(entry) => setConfirmAction({ kind: 'cancel', entry })}
      onDelete={(entry) => setConfirmAction({ kind: 'delete', entry })}
    />
  );

  const details = selectedEntry && (
    <FinanceEntryDetails
      entry={selectedEntry}
      category={selectedEntry.categoryId ? categoryMap.get(selectedEntry.categoryId) : undefined}
      nucleus={selectedEntry.nucleusId ? nucleusMap.get(selectedEntry.nucleusId) : undefined}
      busy={busyId === selectedEntry.id}
      onMarkSettled={handleMarkSettled}
      onEdit={openEdit}
      onCancel={(entry) => setConfirmAction({ kind: 'cancel', entry })}
      onDelete={(entry) => setConfirmAction({ kind: 'delete', entry })}
    />
  );

  return (
    <StellaParallax layers={stellaParallaxScene} className="bills-page__parallax">
      <BackgroundLayer />

      <div className="bills-page__content">
        <div className={`bills-page__layout bills-page__layout--${breakpoint}`}>
          <div className="bills-page__main">
            <ScreenShell title="Contas">
              <p className="bills-page__summary">
                {entries ? `${filtered.length} lançamento(s) nesta visão.` : 'Carregando resumo…'}
              </p>
              <BillsFiltersBar value={filter} onChange={setFilter} />
              {list}
            </ScreenShell>
          </div>

          {breakpoint === 'desktop' && (
            <aside className="bills-page__details-panel">
              {details ?? <p className="bills-page__details-placeholder">Selecione um lançamento para ver os detalhes.</p>}
            </aside>
          )}
        </div>

        {breakpoint === 'tablet' && selectedEntry && (
          <StellaDrawer label="Detalhes do lançamento" onClose={() => setSelectedId(null)}>
            {details}
          </StellaDrawer>
        )}

        {breakpoint === 'mobile' && selectedEntry && (
          <StellaBottomSheet title="Detalhes" onClose={() => setSelectedId(null)}>
            {details}
          </StellaBottomSheet>
        )}

        {confirmAction && (
          <StellaConfirmDialog
            title={confirmAction.kind === 'cancel' ? 'Cancelar lançamento' : 'Excluir lançamento'}
            message={
              confirmAction.kind === 'cancel'
                ? `Cancelar "${confirmAction.entry.title}"? Ele deixa de contar nas contas pendentes.`
                : `Excluir "${confirmAction.entry.title}" definitivamente? Esta ação não pode ser desfeita.`
            }
            confirmLabel={confirmAction.kind === 'cancel' ? 'Cancelar lançamento' : 'Excluir'}
            cancelLabel="Voltar"
            onConfirm={confirmCancelOrDelete}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    </StellaParallax>
  );
}
