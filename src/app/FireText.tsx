"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  stretch: number;
  phase: number;
  ember: boolean;
};

type Palette = {
  core: string;
  mid: string;
  edge: string;
  glow: string;
};

const WARM: Palette = {
  core: "rgba(255,250,218,0.98)",
  mid: "rgba(255,171,51,0.88)",
  edge: "rgba(185,42,10,0.12)",
  glow: "rgba(255,83,18,0.24)",
};

const BLUE: Palette = {
  core: "rgba(244,255,255,0.99)",
  mid: "rgba(83,202,255,0.90)",
  edge: "rgba(37,74,227,0.13)",
  glow: "rgba(44,120,255,0.26)",
};

export default function FireText({ label }: { label: string }) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const text = textRef.current;
    const canvas = canvasRef.current;
    if (!root || !text || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let cancelled = false;
    let hovered = false;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let padX = 24;
    let padTop = 58;
    let padBottom = 12;
    let edgeY: number[] = [];
    let particles: Particle[] = [];
    let spawnCarry = 0;
    let last = performance.now();

    const hostLink = root.closest("a");
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = false; };
    hostLink?.addEventListener("mouseenter", onEnter);
    hostLink?.addEventListener("mouseleave", onLeave);

    const rebuild = () => {
      const rect = text.getBoundingClientRect();
      const style = getComputedStyle(text);
      width = Math.max(1, Math.ceil(rect.width));
      height = Math.max(1, Math.ceil(rect.height));
      const fontSize = Number.parseFloat(style.fontSize) || 64;
      padX = Math.max(18, Math.round(fontSize * 0.22));
      padTop = Math.max(46, Math.round(fontSize * 0.88));
      padBottom = Math.max(10, Math.round(fontSize * 0.16));
      const cssW = width + padX * 2;
      const cssH = height + padTop + padBottom;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.style.left = `${-padX}px`;
      canvas.style.top = `${-padTop}px`;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mask = document.createElement("canvas");
      mask.width = Math.max(1, Math.ceil(cssW));
      mask.height = Math.max(1, Math.ceil(cssH));
      const m = mask.getContext("2d", { willReadFrequently: true });
      if (!m) return;

      m.clearRect(0, 0, cssW, cssH);
      m.fillStyle = "#fff";
      m.font = style.font;
      m.textBaseline = "top";
      m.textAlign = "left";
      m.fillText(label, padX, padTop);

      const data = m.getImageData(0, 0, mask.width, mask.height).data;
      edgeY = new Array(mask.width).fill(-1);
      for (let x = padX; x < Math.min(mask.width, padX + width + 2); x += 1) {
        for (let y = Math.max(0, padTop - 1); y < Math.min(mask.height, padTop + height + 3); y += 1) {
          if (data[(y * mask.width + x) * 4 + 3] > 52) {
            edgeY[x] = y;
            break;
          }
        }
      }
      particles = particles.filter((p) => p.x >= 0 && p.x <= cssW && p.y <= cssH);
    };

    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(text);
    rebuild();

    const spawn = (count: number) => {
      if (!edgeY.length) return;
      const minX = padX;
      const maxX = Math.min(edgeY.length - 1, padX + width);
      for (let i = 0; i < count; i += 1) {
        let x = minX + Math.random() * Math.max(1, maxX - minX);
        let ix = Math.round(x);
        let y = edgeY[ix] ?? -1;
        if (y < 0) {
          let found = false;
          for (let s = 1; s < 9; s += 1) {
            const a = ix - s;
            const b = ix + s;
            if (a >= minX && edgeY[a] >= 0) {
              ix = a;
              x = a;
              y = edgeY[a];
              found = true;
              break;
            }
            if (b <= maxX && edgeY[b] >= 0) {
              ix = b;
              x = b;
              y = edgeY[b];
              found = true;
              break;
            }
          }
          if (!found) continue;
        }

        const ember = Math.random() < 0.10;
        const maxLife = ember ? 1.20 + Math.random() * 0.90 : 0.46 + Math.random() * 0.48;
        particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + 3 + Math.random() * 5,
          vx: (Math.random() - 0.5) * (ember ? 8 : 9),
          vy: -(ember ? 46 + Math.random() * 52 : 42 + Math.random() * 54),
          life: maxLife,
          maxLife,
          size: ember ? 0.7 + Math.random() * 1.25 : 2.35 + Math.random() * 4.1,
          stretch: ember ? 1 : 2.15 + Math.random() * 2.25,
          phase: Math.random() * Math.PI * 2,
          ember,
        });
      }
    };

    const drawParticle = (p: Particle, palette: Palette, alpha: number) => {
      const age = 1 - p.life / p.maxLife;
      const fade = Math.sin(Math.min(1, age) * Math.PI) * alpha;
      if (p.ember) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = palette.core;
        ctx.globalAlpha = Math.min(0.9, fade * 1.35);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      const r = p.size * (1 - age * 0.36);
      const sy = r * p.stretch;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(p.x, p.y);
      ctx.scale(1, Math.max(1, p.stretch));
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, r));
      g.addColorStop(0, palette.core);
      g.addColorStop(0.26, palette.mid);
      g.addColorStop(0.68, palette.edge);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = fade * 0.74;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.62, Math.max(1, sy / Math.max(1, p.stretch)), 0, 0, Math.PI * 2);
      ctx.fill();

      // Narrow white-hot core: keeps the flame crisp rather than blob-like.
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, r * 0.55));
      core.addColorStop(0, palette.core);
      core.addColorStop(0.30, palette.core);
      core.addColorStop(0.72, palette.mid);
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = fade * 0.48;
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.10, r * 0.28, Math.max(1, r * 0.70), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawGlow = (palette: Palette, t: number) => {
      const cssW = width + padX * 2;
      const glowY = padTop + Math.max(2, height * 0.05);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.20 + Math.sin(t * 0.0026) * 0.035;
      const g = ctx.createLinearGradient(padX, 0, padX + width, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.08, palette.glow);
      g.addColorStop(0.5, palette.mid);
      g.addColorStop(0.92, palette.glow);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.filter = "blur(8px)";
      ctx.fillStyle = g;
      ctx.fillRect(0, glowY - 5, cssW, 11);
      ctx.restore();
    };

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000));
      last = now;
      const cssW = width + padX * 2;
      const cssH = height + padTop + padBottom;
      ctx.clearRect(0, 0, cssW, cssH);

      const palette = hovered ? BLUE : WARM;
      drawGlow(palette, now);

      const rate = Math.max(34, width * 0.46);
      spawnCarry += rate * dt;
      const count = Math.floor(spawnCarry);
      if (count > 0) {
        spawn(count);
        spawnCarry -= count;
      }

      const next: Particle[] = [];
      for (const p of particles) {
        p.life -= dt;
        if (p.life <= 0) continue;
        const age = 1 - p.life / p.maxLife;
        p.phase += dt * (4.8 + age * 2.2);
        p.vx += Math.sin(p.phase) * dt * (p.ember ? 6 : 11);
        p.vy -= dt * (p.ember ? 3 : 12);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        drawParticle(p, palette, 1 - age * 0.22);
        next.push(p);
      }
      particles = next.slice(-360);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      hostLink?.removeEventListener("mouseenter", onEnter);
      hostLink?.removeEventListener("mouseleave", onLeave);
    };
  }, [label]);

  return (
    <span className="poe-v53-fire-root" ref={rootRef}>
      <canvas className="poe-v53-fire-canvas" ref={canvasRef} aria-hidden="true" />
      <span className="poe-v53-fire-copy" ref={textRef}>{label}</span>
    </span>
  );
}
