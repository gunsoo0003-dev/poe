'use client';

import { useEffect, useRef } from 'react';
import styles from './atlas-visuals.module.css';

type Scene = 'systems' | 'scale' | 'progress';

// Fixed-decimal SVG coordinates keep server HTML and browser hydration identical.
const svgCoord = (value: number): string => value.toFixed(4);

type Particle = { x: number; y: number; r: number; delay: number };
const stars: Particle[] = Array.from({ length: 64 }, (_, i) => ({
  x: (i * 73.61 + 13) % 100, y: (i * 39.17 + 9) % 100,
  r: i % 5 === 0 ? 1.6 : 0.7, delay: (i % 11) * -0.37,
}));

function NodeField({ dense = false, blue = false }: { dense?: boolean; blue?: boolean }) {
  const count = dense ? 126 : 46;
  const nodes = Array.from({ length: count }, (_, i) => {
    const ring = dense ? 1 + Math.floor(i / 22) : 1 + Math.floor(i / 12);
    const theta = i * 2.39996323;
    const radius = (dense ? 16 : 26) + Math.sqrt(i / count) * (dense ? 172 : 162);
    return { x: svgCoord(250 + Math.cos(theta) * radius), y: svgCoord(215 + Math.sin(theta) * radius * .82), ring, i };
  });
  return <svg className={`${styles.tree} ${blue ? styles.treeBlue : ''}`} viewBox="0 0 500 430" aria-hidden="true">
    <defs>
      <radialGradient id={blue ? 'blue-core' : 'gold-core'}><stop stopColor={blue ? '#b4ddff' : '#fff2c7'}/><stop offset=".35" stopColor={blue ? '#4c91dd' : '#f3b86b'}/><stop offset="1" stopColor={blue ? '#112e57' : '#4d2415'}/></radialGradient>
    </defs>
    <circle cx="250" cy="215" r="184" fill="none" stroke="currentColor" opacity=".16" strokeDasharray="2 12"/>
    <circle cx="250" cy="215" r="138" fill="none" stroke="currentColor" opacity=".12"/>
    {nodes.map((n, i) => { const parent = nodes[Math.max(0, i - (dense ? 22 : 12))]; return i > 0 && <line key={`l${i}`} x1={parent.x} y1={parent.y} x2={n.x} y2={n.y} className={styles.nodeLink} style={{ animationDelay: `${(i % 13) * -.17}s` }}/>; })}
    {nodes.map((n) => <g key={n.i} className={styles.nodePulse} style={{ animationDelay: `${(n.i % 17) * -.24}s` }}><circle cx={n.x} cy={n.y} r={dense ? 4.3 : 6.5} fill="#0c101b" stroke="currentColor" strokeWidth="1.3"/><circle cx={n.x} cy={n.y} r={dense ? 1.9 : 3.1} fill="currentColor"/></g>)}
    <circle cx="250" cy="215" r="24" fill={`url(#${blue ? 'blue-core' : 'gold-core'})`} stroke="currentColor" strokeWidth="1.5" className={styles.core}/>
    <circle cx="250" cy="215" r="34" fill="none" stroke="currentColor" opacity=".45" strokeDasharray="3 5"/>
    <path d="M250 174 L258 207 L291 215 L258 223 L250 256 L242 223 L209 215 L242 207Z" fill="none" stroke="currentColor" strokeWidth="1" opacity=".65"/>
  </svg>;
}

function Atmosphere() {
  return <div className={styles.atmosphere} aria-hidden="true"><div className={styles.orbit}/>{stars.map((s, i) => <i key={i} className={styles.star} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, animationDelay: `${s.delay}s` }}/>)}</div>;
}

function Header({ code, title, subtitle }: { code: string; title: string; subtitle: string }) {
  return <header className={styles.header}><div className={styles.eyebrow}><span className={styles.liveDot}/> FIXLGS / ATLAS INTELLIGENCE <span className={styles.code}>{code}</span></div><h3>{title}</h3><p>{subtitle}</p></header>;
}

function SystemScene() {
  return <div className={styles.systemGrid}>
    <div className={styles.systemCard}><span className={styles.cardIndex}>01 / ENDGAME</span><div className={styles.miniTree}><NodeField/></div><div className={styles.systemLabel}><span className={styles.marker}/> ATLAS PASSIVE</div><strong>아틀라스 패시브</strong><span className={styles.systemDetail}>지도 · 엔드게임 보상</span></div>
    <div className={`${styles.systemCard} ${styles.blue}`}><span className={styles.cardIndex}>02 / CHARACTER</span><div className={styles.miniTree}><NodeField blue/></div><div className={styles.systemLabel}><span className={styles.marker}/> CHARACTER PASSIVE</div><strong>캐릭터 패시브</strong><span className={styles.systemDetail}>전투 · 캐릭터 성장</span></div>
    <span className={styles.systemDivider} aria-hidden="true">≠</span>
  </div>;
}

function ScaleScene() {
  const points = Array.from({ length: 210 }, (_, i) => {
    const a = i * 2.399963;
    const r = Math.sqrt((i + .5) / 210);
    return { x: svgCoord(250 + Math.cos(a) * r * 220), y: svgCoord(145 + Math.sin(a) * r * 119) };
  });
  const newPoints = Array.from({ length: 49 }, (_, i) => {
    const a = i * 2.399963;
    const r = Math.sqrt((i + .5) / 49);
    return { x: svgCoord(250 + Math.cos(a) * r * 200), y: svgCoord(145 + Math.sin(a) * r * 108) };
  });
  return <div className={styles.scaleGrid}>
    <div className={styles.scaleCard}><div className={styles.scaleTop}><span>LEGACY ATLAS</span><strong>300<span>+</span></strong></div><svg viewBox="0 0 500 290" className={styles.density} aria-label="기존 대규모 트리의 높은 노드 밀도를 추상적으로 표현"><circle cx="250" cy="145" r="116" className={styles.densityRing}/>{points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i % 13 === 0 ? 4.5 : 2.1} className={styles.densityPoint} style={{ animationDelay: `${(i % 23) * -.11}s` }}/>)}</svg><div className={styles.scaleBottom}>기존 0.5 계열 <span>HIGH DENSITY</span></div></div>
    <div className={styles.scaleCard}><div className={styles.scaleTop}><span>ATLAS 1.0 / TARGET</span><strong>~70</strong></div><svg viewBox="0 0 500 290" className={`${styles.density} ${styles.newDensity}`} aria-label="발표된 약 70개 노드의 압축된 규모를 추상적으로 표현"><circle cx="250" cy="145" r="116" className={styles.densityRing}/>{newPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i % 7 === 0 ? 7 : 4.5} className={styles.densityPoint} style={{ animationDelay: `${(i % 19) * -.16}s` }}/>)}</svg><div className={styles.scaleBottom}>1.0 발표 목표 <span>CONCENTRATED</span></div></div>
    <div className={styles.scaleCenter} aria-hidden="true"><span>RESTRUCTURE</span><b>⇢</b></div>
  </div>;
}

function ProgressScene() {
  return <div className={styles.progressStage}>
    <div className={styles.progressOrbit} aria-hidden="true"><div className={styles.progressRing}/><div className={styles.progressRing2}/><div className={styles.progressRay}/></div>
    <div className={styles.progressNodes}>
      <div className={styles.progressNode}><span className={styles.nodeNumber}>I / OBJECTIVES</span><div className={styles.hex}><span>✧</span></div><strong>특수 지도 목표</strong><small>개별 목표 달성</small></div>
      <div className={styles.progressNode}><span className={styles.nodeNumber}>II / CITADEL</span><div className={styles.hex}><span>⌘</span></div><strong>요새 주요 목표</strong><small>시설 및 보스 진행</small></div>
      <div className={styles.progressNode}><span className={styles.nodeNumber}>III / ENDGAME</span><div className={styles.hex}><span>✦</span></div><strong>최종 보스 진행</strong><small>발표된 목표 경로</small></div>
    </div><div className={styles.progressFooter}><span className={styles.progressPulse}/> POINTS DISTRIBUTED ACROSS OBJECTIVES <span className={styles.progressPulse}/></div>
  </div>;
}

export default function AtlasVisuals({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => { el.classList.toggle(styles.visible, entry.isIntersecting); }, { threshold: .08 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const headings = {
    systems: ['SYS / 01', '두 개의 패시브, 서로 다른 세계', '아틀라스와 캐릭터 성장 시스템의 분리'],
    scale: ['DATA / 02', 'THE ATLAS REFORGED', '수백 개의 노드를 더 적은 구조로 압축하는 1.0 발표 방향'],
    progress: ['PATH / 03', 'THE ROAD TO THE ENDGAME', '개별 목표에서 요새와 보스까지, 분산된 보상 구조'],
  } as const;
  const h = headings[scene];
  return <section ref={ref} className={`${styles.panel} ${styles[scene]}`} aria-label={h[1]}><Atmosphere/><div className={styles.panelContent}><Header code={h[0]} title={h[1]} subtitle={h[2]}/>{scene === 'systems' ? <SystemScene/> : scene === 'scale' ? <ScaleScene/> : <ProgressScene/>}<footer className={styles.foot}><span>FIXLGS VISUAL LAB</span><span>CONCEPT VISUALIZATION · NOT IN-GAME UI</span></footer></div></section>;
}
