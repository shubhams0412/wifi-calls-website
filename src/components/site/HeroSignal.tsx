'use client';

import { useEffect, useRef } from 'react';

/** Soft Wi-Fi "broadcast rings" drawn behind the hero gradient. */
export default function HeroSignal() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, cx = 0, cy = 0, maxR = 0, raf = 0;

    const resize = () => {
      const host = canvas.parentElement!;
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W * 0.5; cy = H * 0.42; maxR = Math.max(W, H) * 0.6;
    };
    const ring = (r: number, a: number) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.1; ctx.stroke();
    };
    const frame = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const period = 4200;
      for (let k = 0; k < 4; k++) {
        const phase = ((t + k * (period / 4)) % period) / period;
        const r = phase * maxR;
        if (r > 4) ring(r, (1 - phase) * 0.14);
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    if (reduce) { ring(maxR * 0.45, 0.1); ring(maxR * 0.72, 0.06); } else raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas id="signal" ref={ref} aria-hidden="true" />;
}
