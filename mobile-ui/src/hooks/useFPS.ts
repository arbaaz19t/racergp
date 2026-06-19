import { useEffect, useState } from 'react';

export function useFPS() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return fps;
}
