"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  glow: number;
  phase: number;
};

export default function HeroAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let cancelled = false;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let embers: Ember[] = [];
    let spawnCarry = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      embers = embers.filter((p) => p.x >= 0 && p.x <= width && p.y >= -80 && p.y <= height + 40);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const spawn = (count: number) => {
      for (let i = 0; i < count; i += 1) {
        // Most embers originate from the lower-left/center where the mockup has warm light.
        const bias = Math.random();
        const x = bias < 0.72
          ? width * (0.16 + Math.random() * 0.44)
          : width * (0.42 + Math.random() * 0.45);
        const y = height * (0.64 + Math.random() * 0.34);
        const maxLife = 1.5 + Math.random() * 2.6;
        embers.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 16,
          vy: -(14 + Math.random() * 38),
          life: maxLife,
          maxLife,
          size: 0.45 + Math.random() * 1.55,
          glow: 0.45 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawWarmHaze = (now: number) => {
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.00055);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const horizon = ctx.createRadialGradient(
        width * 0.39,
        height * 0.78,
        0,
        width * 0.39,
        height * 0.78,
        width * 0.34,
      );
      horizon.addColorStop(0, `rgba(255,132,35,${0.070 + pulse * 0.018})`);
      horizon.addColorStop(0.32, `rgba(213,72,20,${0.040 + pulse * 0.012})`);
      horizon.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, 0, width, height);

      const logoGlow = ctx.createRadialGradient(
        width * 0.19,
        height * 0.16,
        0,
        width * 0.19,
        height * 0.16,
        width * 0.14,
      );
      logoGlow.addColorStop(0, `rgba(220,53,17,${0.050 + pulse * 0.016})`);
      logoGlow.addColorStop(0.44, `rgba(163,31,13,${0.026 + pulse * 0.010})`);
      logoGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = logoGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000));
      last = now;
      ctx.clearRect(0, 0, width, height);

      drawWarmHaze(now);

      // Sparse and irregular: enough to feel alive, not enough to look like fireworks.
      spawnCarry += (6.5 + width / 520) * dt;
      const count = Math.floor(spawnCarry);
      if (count > 0) {
        spawn(count);
        spawnCarry -= count;
      }

      const next: Ember[] = [];
      for (const p of embers) {
        p.life -= dt;
        if (p.life <= 0) continue;
        const age = 1 - p.life / p.maxLife;
        p.phase += dt * (1.8 + Math.random() * 0.08);
        p.vx += Math.sin(p.phase) * dt * 4.5;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const fadeIn = Math.min(1, age / 0.16);
        const fadeOut = Math.min(1, p.life / Math.max(0.32, p.maxLife * 0.34));
        const alpha = fadeIn * fadeOut;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * p.glow;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4.2);
        g.addColorStop(0, "rgba(255,244,181,.94)");
        g.addColorStop(0.18, "rgba(255,165,56,.82)");
        g.addColorStop(0.48, "rgba(239,71,19,.34)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        next.push(p);
      }
      embers = next.slice(-95);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas className="poe-v55-hero-atmosphere" ref={canvasRef} aria-hidden="true" />;
}
