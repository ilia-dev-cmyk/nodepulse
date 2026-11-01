import { X } from 'lucide-react';
import { useNativeDialog } from '../../hooks/useDialog';
import { SidebarContent } from './SidebarContent';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useNativeDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      className="nav-drawer"
      aria-label="Workspace navigation"
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="nav-drawer__surface">
        <button
          type="button"
          className="icon-btn icon-btn--sm nav-drawer__close"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </dialog>
  );
}
