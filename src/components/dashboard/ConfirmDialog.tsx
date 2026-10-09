import { useEffect, useRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
  heading: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ heading, children, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the safe option, and close on Escape
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="dash-overlay" onClick={onCancel}>
      <div
        className="dash-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dash-dialog-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dash-dialog-heading">{heading}</h2>
        <div className="dash-dialog-body">{children}</div>
        <div className="dash-dialog-actions">
          <button ref={cancelRef} type="button" className="dash-btn dash-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="dash-btn dash-btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
