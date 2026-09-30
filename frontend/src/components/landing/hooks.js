import { useEffect, useRef, useState } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

let webglSupport;
/** True when the browser can create a WebGL context. Result is cached. */
export const hasWebGL = () => {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      webglSupport = Boolean(gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
};

/**
 * Tracks the pointer as -1..1 on both axes in a ref (no re-renders), so a 3D
 * scene can read it every frame. Listens on window so it keeps working when
 * text or other elements sit on top of the canvas.
 */
export const usePointerRef = (enabled) => {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    ref.current.x = 0;
    ref.current.y = 0;
    if (!enabled) return undefined;
    const onMove = (e) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);
  return ref;
};
