import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ridge(rand: () => number, baseY: number, amp: number, steps: number) {
  const pts = Array.from({ length: steps + 1 }, (_, i) => [(i / steps) * 400, baseY - rand() * amp] as const);
  let d = `M0 300 L${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + " L400 300Z";
}

const PALETTES: Record<string, { sky: [string, string]; sun: string; far: string; mid: string; near: string }> = {
  trilha: { sky: ["#aebfc5", "#f1ede3"], sun: "#d8a24a", far: "#6a838d", mid: "#3f7352", near: "#1b3426" },
  cachoeira: { sky: ["#cbd8c0", "#f8f5ee"], sun: "#ebcb8b", far: "#6b8f5e", mid: "#2f5a3f", near: "#14261b" },
  mirante: { sky: ["#e0a57f", "#f1ede3"], sun: "#d8a24a", far: "#6a838d", mid: "#3b4f58", near: "#1b3426" },
  parque: { sky: ["#aebfc5", "#e3eadb"], sun: "#ebcb8b", far: "#87a878", mid: "#3f7352", near: "#24432f" },
  biodiversidade: { sky: ["#e3eadb", "#f8f5ee"], sun: "#c26b3f", far: "#a9c29b", mid: "#6b8f5e", near: "#24432f" },
  evento: { sky: ["#ebcb8b", "#f1ede3"], sun: "#c26b3f", far: "#87a878", mid: "#3f7352", near: "#1b3426" },
};

export function Landscape({ seed = 1, variant = "trilha", className }: { seed?: number; variant?: string; className?: string }) {
  const id = useId();
  const p = PALETTES[variant] ?? PALETTES.trilha;
  const shapes = useMemo(() => {
    const r = rng(seed * 97 + 13);
    const trees = Array.from({ length: 9 }, () => ({ x: r() * 400, h: 26 + r() * 30 }));
    return { far: ridge(r, 170, 70, 9), mid: ridge(r, 215, 60, 8), near: ridge(r, 262, 36, 7), trees, sunX: 80 + r() * 240, fall: 130 + r() * 140 };
  }, [seed]);

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <circle cx={shapes.sunX} cy="78" r="14" fill={p.sun} opacity="0.9" />
      <path d={shapes.far} fill={p.far} opacity="0.75" />
      <path d={shapes.mid} fill={p.mid} />
      {variant === "cachoeira" && (
        <g stroke="#f8f5ee" strokeLinecap="round" opacity="0.85">
          <line x1={shapes.fall} y1="170" x2={shapes.fall} y2="250" strokeWidth="5" />
          <line x1={shapes.fall + 9} y1="180" x2={shapes.fall + 9} y2="240" strokeWidth="2.5" />
        </g>
      )}
      <path d={shapes.near} fill={p.near} />
      {shapes.trees.map((t, i) => (
        <path key={i} d={`M${t.x - 9} 300 L${t.x} ${300 - t.h} L${t.x + 9} 300Z`} fill={p.near} />
      ))}
      {variant === "trilha" && (
        <path d="M190 300 C170 275 235 268 205 248 C185 236 225 228 214 214" fill="none" stroke="#f1ede3" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8" />
      )}
    </svg>
  );
}
