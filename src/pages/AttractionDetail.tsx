import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Gauge, MapPin, Mountain, Route, ShieldAlert } from "lucide-react";
import { EventCard } from "@/components/Cards";
import { Media } from "@/components/Media";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, useFetch } from "@/lib/api";
import type { AttractionDetail as Detail } from "@/lib/types";
import { LABELS } from "@/shared/constants";

export default function AttractionDetail() {
  const { slug } = useParams();
  const { data: a, loading, error } = useFetch<Detail>(`/attractions/${slug}`);

  if (loading) return <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-12 sm:px-8"><Skeleton className="h-80 w-full" /><Skeleton className="h-10 w-1/2" /></div>;
  if (error || !a)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-24 text-center sm:px-8">
        <h1 className="text-4xl">Atração não encontrada</h1>
        <Button asChild className="mt-6 rounded-full"><Link to="/atracoes">Ver todas as atrações</Link></Button>
      </div>
    );

  const facts = [
    { icon: Gauge, label: "Dificuldade", value: a.difficulty && LABELS[a.difficulty] },
    { icon: Route, label: "Distância", value: a.distance_km != null && `${a.distance_km} km` },
    { icon: Clock, label: "Duração", value: a.duration },
    { icon: Mountain, label: "Altitude", value: a.altitude_m != null && `${a.altitude_m} m` },
  ].filter((f) => f.value);

  return (
    <>
      <section className="relative">
        <Media imageKey={a.image_key} alt={a.name} seed={a.id} variant={a.category} className="h-[44vh] min-h-72 w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_38_27/0.1),rgb(20_38_27/0.8))]" />
        {a.image_key && a.image_credit && (
          <p className="absolute right-3 top-3 max-w-[70%] rounded bg-black/45 px-2 py-1 text-[0.65rem] text-pedra-50/90">{a.image_credit}</p>
        )}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1200px] px-4 pb-8 text-pedra-50 sm:px-8">
            <Link to="/atracoes" className="mb-4 inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100"><ArrowLeft className="size-4" /> Atrações</Link>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={a.status} />
              <span className="text-[0.72rem] font-medium uppercase tracking-[0.22em] opacity-80">{LABELS[a.category]}</span>
            </div>
            <h1 className="mt-3 text-4xl sm:text-6xl">{a.name}</h1>
            <p className="mt-2 inline-flex items-center gap-2 text-sm opacity-90"><MapPin className="size-4" /> {a.location}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div>
          {a.status !== "aberta" && (
            <Alert className="mb-8 border-terra-300 bg-[#f9e8dc]">
              <ShieldAlert className="size-4 text-terra-600" />
              <AlertTitle>{a.status === "fechada" ? "Acesso fechado" : "Acesso em manutenção"}</AlertTitle>
              <AlertDescription>Esta atração não está disponível para visita no momento. Volte a conferir antes de planejar o passeio.</AlertDescription>
            </Alert>
          )}
          <p className="font-serif text-2xl leading-snug text-floresta-800">{a.summary}</p>
          {a.description && <p className="mt-6 whitespace-pre-line text-muted-foreground">{a.description}</p>}

          {a.safety_notes && (
            <Alert className="mt-10 border-ambar-300 bg-[#fbf1da]">
              <ShieldAlert className="size-4 text-[#8a5f12]" />
              <AlertTitle>Segurança nesta atração</AlertTitle>
              <AlertDescription>{a.safety_notes}</AlertDescription>
            </Alert>
          )}

          {a.seasons.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-3xl">Temporadas e disponibilidade</h2>
              <ul className="space-y-3">
                {a.seasons.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border bg-card p-4">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      {s.notes && <p className="text-sm text-muted-foreground">{s.notes}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <span className={s.kind === "fechada" ? "font-semibold text-terra-600" : "font-semibold text-floresta-700"}>{LABELS[s.kind]}</span>
                      <p className="text-muted-foreground">{formatDate(s.start_date).toLocaleDateString("pt-BR")} a {formatDate(s.end_date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.events.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-3xl">Eventos nesta atração</h2>
              <div className="space-y-4">{a.events.map((e) => <EventCard key={e.id} e={e} />)}</div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-[var(--radius)] border bg-card p-6">
          <h2 className="text-2xl">Informações</h2>
          <dl className="mt-5 space-y-5">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 text-floresta-600" strokeWidth={1.5} aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              </div>
            ))}
          </dl>
          <Button asChild variant="outline" className="btn-label mt-7 h-11 w-full rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/seguranca">Dicas de segurança</Link>
          </Button>
        </aside>
      </div>
    </>
  );
}
