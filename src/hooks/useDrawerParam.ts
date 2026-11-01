import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Keeps a detail drawer's open entity in the URL so views are deep-linkable. */
export function useDrawerParam(name: string) {
  const [params, setParams] = useSearchParams();
  const value = params.get(name);

  const open = useCallback(
    (id: string) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set(name, id);
          return next;
        },
        { replace: true },
      );
    },
    [name, setParams],
  );

  const close = useCallback(() => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete(name);
        return next;
      },
      { replace: true },
    );
  }, [name, setParams]);

  return { value, open, close };
}
