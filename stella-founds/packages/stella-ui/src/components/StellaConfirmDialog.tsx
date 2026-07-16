import { Modal } from './Modal';
import { StellaButton } from './StellaButton';
import './StellaConfirmDialog.css';

/** Accessible confirmation modal for destructive/irreversible actions (delete, cancel). Built on Modal, so it already gets ESC-to-close and focus containment for free. */
export function StellaConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="stella-confirm-dialog__message">{message}</p>
      <div className="stella-confirm-dialog__actions">
        <StellaButton type="button" onClick={onCancel}>
          {cancelLabel}
        </StellaButton>
        <StellaButton type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </StellaButton>
      </div>
    </Modal>
  );
}
