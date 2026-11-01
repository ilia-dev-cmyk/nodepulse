import { useEffect, useRef } from 'react';

const SCROLL_LOCK_CLASS = 'has-dialog';

/**
 * Several dialogs can be on screen at once (for example a detail drawer with a
 * confirmation modal above it), React StrictMode mounts effects twice in
 * development, and dialogs are frequently unmounted while still open because
 * their visibility is driven by URL state.
 *
 * A reference-counted lock keyed by the dialog element keeps <body> locked for
 * exactly as long as at least one dialog is open, and repeated
 * acquire/release calls for the same element are no-ops.
 */
const lockedDialogs = new WeakSet<HTMLDialogElement>();
let scrollLockCount = 0;

function acquireScrollLock(dialog: HTMLDialogElement) {
  if (typeof document === 'undefined' || lockedDialogs.has(dialog)) return;
  lockedDialogs.add(dialog);
  scrollLockCount += 1;
  document.body.classList.add(SCROLL_LOCK_CLASS);
}

function releaseScrollLock(dialog: HTMLDialogElement) {
  if (typeof document === 'undefined' || !lockedDialogs.has(dialog)) return;
  lockedDialogs.delete(dialog);
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.classList.remove(SCROLL_LOCK_CLASS);
  }
}

/**
 * Keeps a native <dialog> element in sync with React state.
 * Native dialogs provide focus trapping and an accessible modal backdrop.
 */
export function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const openRef = useRef(open);

  // Keep the latest callback without re-subscribing the native listeners on
  // every render (parents pass inline handlers).
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Declared before the sync effect so it is already up to date when our own
  // dialog.close() emits a `close` event during the same commit.
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      acquireScrollLock(dialog);
    } else if (dialog.open) {
      dialog.close();
      releaseScrollLock(dialog);
    }

    // Runs on unmount and before every re-run, including StrictMode's
    // simulated unmount, so the lock can never outlive its dialog.
    return () => {
      releaseScrollLock(dialog);
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    const handleClose = () => {
      // Only notify consumers when the dialog closed while React still
      // considers it open (for example a native close). Closes triggered by a
      // state update already went through onClose.
      if (openRef.current) onCloseRef.current();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, []);

  return ref;
}
