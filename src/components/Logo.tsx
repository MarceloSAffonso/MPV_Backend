import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const id = useId();
  const light = tone === "light";
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Circuito Terê Verde">
      <defs>
        <clipPath id={id}>
          <circle cx="60" cy="60" r="54" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="54" fill={light ? "#2f5a3f" : "#1b3426"} />
      <g clipPath={`url(#${id})`}>
        <circle cx="87" cy="36" r="9" fill="#d8a24a" />
        <path d="M0 80 L20 62 L34 72 L52 52 L72 70 L92 56 L120 78 V120 H0Z" fill="#3f7352" />
        <path d="M42 90 L45 46 Q46 34 51 24 Q53 22 54 26 Q57 36 58 48 L63 90Z" fill={light ? "#cbd8c0" : "#a9c29b"} />
        <path d="M51 24 Q53 22 54 26 Q57 36 58 48 L63 90 L53 90 Q53 55 51 24Z" fill={light ? "#a9c29b" : "#87a878"} />
        <path d="M0 94 L28 78 L50 90 L82 68 L120 92 V120 H0Z" fill={light ? "#24432f" : "#2f5a3f"} />
        <path d="M0 106 Q40 90 70 102 T120 100 V120 H0Z" fill="#14261b" />
        <path d="M58 120 C44 112 80 108 66 100 C56 94 74 90 70 84" fill="none" stroke="#f1ede3" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 6" />
      </g>
      <circle cx="60" cy="60" r="57.5" fill="none" stroke="#d8a24a" strokeWidth="1.6" strokeDasharray="320 40" strokeLinecap="round" transform="rotate(-70 60 60)" />
      <path d="M96 14 C108 16 112 28 106 36 C94 34 90 22 96 14Z" fill={light ? "#a9c29b" : "#87a878"} />
      <path d="M97 17 Q102 26 105 34" fill="none" stroke={light ? "#14261b" : "#1b3426"} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} className="size-12 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[0.62rem] font-medium uppercase tracking-[0.42em]", light ? "text-terra-300" : "text-terra-500")}>
          Circuito
        </span>
        <span
          className={cn("font-serif text-[1.65rem] font-medium tracking-tight", light ? "text-pedra-50" : "text-floresta-800")}
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          Terê Verde
        </span>
        <span className={cn("mt-1 text-[0.55rem] font-medium uppercase tracking-[0.3em]", light ? "text-nevoa-300" : "text-muted-foreground")}>
          Teresópolis · RJ
        </span>
      </span>
    </span>
  );
}
