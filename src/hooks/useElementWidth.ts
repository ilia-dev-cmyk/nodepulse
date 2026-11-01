import { useEffect, useRef, useState } from 'react';

/** Tracks the rendered width of an element so SVG charts can scale fluidly. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = (nextWidth: number) => {
      setWidth((current) => (Math.abs(current - nextWidth) > 0.5 ? nextWidth : current));
    };

    update(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
