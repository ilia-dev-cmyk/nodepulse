import { useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useNativeDialog } from '../../hooks/useDialog';
import { cn } from '../../lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const ref = useNativeDialog(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <dialog
      ref={ref}
      className={cn('modal', `modal--${size}`)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal__surface">
        <header className="modal__header">
          <div>
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="modal__description" id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
