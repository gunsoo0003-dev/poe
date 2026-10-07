"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function RevealSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`poe-v9-section poe-v9-tools-section poe-v26-tools-section${visible ? " is-in-view" : ""}`}
      aria-label="FIX POE2 도구 안내"
    >
      {children}
    </section>
  );
}
