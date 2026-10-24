import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Media } from "@/components/Media";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/api";
import type { Attraction, TereEvent } from "@/lib/types";
import { LABELS } from "@/shared/constants";

export function AttractionCard({ a }: { a: Attraction }) {
  return (
    <Link
      to={`/atracoes/${a.slug}`}
      className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-[var(--radius)] bg-floresta-700 text-pedra-50 shadow-[0_8px_24px_rgb(20_38_27/0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgb(20_38_27/0.22)]"
    >
      <Media imageKey={a.image_key} alt={a.name} seed={a.id} variant={a.category} className="absolute inset-0 transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_38_27/0)_30%,rgb(20_38_27/0.85)_100%)]" />
      <StatusBadge status={a.status} className="absolute left-4 top-4" />
      <div className="relative z-10 flex w-full items-end justify-between gap-3 p-5">
        <div>
          <h3 className="text-[1.65rem]">{a.name}</h3>
          <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] opacity-80">{LABELS[a.category]}</p>
          <p className="mt-2 line-clamp-2 text-sm opacity-90">{a.summary}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-pedra-50/70 transition group-hover:bg-pedra-50 group-hover:text-floresta-800">
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function EventCard({ e }: { e: TereEvent }) {
  const d = formatDate(e.date);
  return (
    <article className="flex gap-5 rounded-[var(--radius)] border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-xl bg-floresta-700 text-pedra-50">
        <span className="font-serif text-3xl leading-none">{d.getDate()}</span>
        <span className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-ambar-300">
          {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <Badge className="mb-2 rounded-full bg-salvia-100 text-[0.65rem] font-semibold uppercase tracking-wider text-floresta-700 hover:bg-salvia-100">{LABELS[e.category]}</Badge>
        <h3 className="text-xl">{e.title}</h3>
        {e.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> {e.time}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden /> {e.location}
          </span>
        </div>
      </div>
    </article>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius)] bg-pedra-200" />
      ))}
    </>
  );
}
