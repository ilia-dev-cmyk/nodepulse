import { useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useNativeDialog } from '../../hooks/useDialog';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  eyebrow,
}: DrawerProps) {
  const ref = useNativeDialog(open, onClose);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="drawer__surface">
        <header className="drawer__header">
          <div className="drawer__heading">
            {eyebrow && <p className="drawer__eyebrow">{eyebrow}</p>}
            <h2 className="drawer__title" id={titleId}>
              {title}
            </h2>
            {subtitle && <div className="drawer__subtitle">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
