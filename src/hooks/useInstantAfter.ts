import { useEffect, useRef } from 'react';

/**
 * True for the render where `token` first reflects a new value, false again
 * from the next render on. Used to suppress a CSS position transition for
 * exactly the frame a marker jumps (replay seek/restart) instead of letting
 * it visibly glide to the new spot.
 *
 * The comparison happens during render (not inside an effect) so the
 * suppressed render is the same one that shows the jumped position — an
 * effect-only implementation would be one render too late and the glide
 * would still play once before snapping.
 */
export function useInstantAfter(token: number): boolean {
  const committedRef = useRef(token);
  const instant = committedRef.current !== token;

  useEffect(() => {
    committedRef.current = token;
  });

  return instant;
}
