import { Link } from "react-router-dom";
import { ArrowRight, Compass, Leaf, Mountain, ShieldCheck } from "lucide-react";
import { AttractionCard, CardGridSkeleton, EventCard } from "@/components/Cards";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/lib/api";
import type { Attraction, TereEvent } from "@/lib/types";

const pill = "btn-label h-12 rounded-full px-7";

export default function Home() {
  const attractions = useFetch<Attraction[]>("/attractions");
  const events = useFetch<TereEvent[]>("/events");
  const featured = attractions.data?.filter((a) => a.featured).slice(0, 3) ?? [];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-floresta-800 text-pedra-50">
        <HeroCarousel attractions={attractions.data} />
        <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-20 sm:px-8 md:pb-40 md:pt-32">
          <span className="eyebrow text-ambar-300">Serra dos Órgãos · Teresópolis</span>
          <h1 className="mt-6 max-w-[12ch] text-6xl sm:text-7xl md:text-[5.2rem]">
            Natureza, calma e <em className="text-terra-300">serra.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-salvia-200">
            Trilhas, cachoeiras, biodiversidade e eventos do Circuito Terê Verde, com o status de cada atração atualizado em tempo real.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button asChild className={`${pill} bg-terra-500 text-white hover:bg-terra-600`}>
              <Link to="/atracoes">
                Explorar atrações <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className={`${pill} border-pedra-50 bg-transparent text-pedra-50 hover:bg-pedra-50 hover:text-floresta-800`}>
              <Link to="/seguranca">Dicas de segurança</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b bg-pedra-50">
        <dl className="mx-auto grid max-w-[1200px] grid-cols-1 divide-y px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          {[
            ["869 m", "de altitude na área urbana"],
            ["3", "unidades de conservação ambiental"],
            ["Ecoturismo", "trilhas e montanhismo"],
          ].map(([n, l]) => (
            <div key={l} className="px-2 py-7 sm:px-8 sm:first:pl-0">
              <dt className="font-serif text-4xl text-floresta-700">{n}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Nossos destinos</span>
            <h2 className="mt-4 text-4xl sm:text-5xl">
              Trilhas mais selvagens, <em className="text-terra-500">dias mais leves.</em>
            </h2>
          </div>
          <Link to="/atracoes" className="btn-label inline-flex items-center gap-2 text-floresta-700 hover:text-terra-600">
            Ver todas <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {attractions.loading ? <CardGridSkeleton /> : featured.map((a) => <AttractionCard key={a.id} a={a} />)}
        </div>
        {attractions.error && <p className="mt-6 text-sm text-destructive">Não foi possível carregar as atrações agora.</p>}
      </section>

      <section className="bg-pedra-50">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2">
          <figure>
            <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius)] shadow-lg">
              <img src="/photos/olhar.jpg" alt="Vale e montanhas de Teresópolis vistos do Parque Natural Municipal" loading="lazy" className="h-full w-full object-cover object-top" />
            </div>
            <figcaption className="mt-2 text-xs text-muted-foreground">Foto: Tedd Santana · CC BY-SA 2.0 · Wikimedia Commons</figcaption>
          </figure>
          <div>
            <span className="eyebrow">Um olhar de perto</span>
            <h2 className="mt-4 text-4xl sm:text-5xl">
              Mais que um passeio. <em className="text-terra-500">Um estado de espírito.</em>
            </h2>
            <p className="mt-5 text-muted-foreground">
              Informação confiável para decidir bem: o que está aberto, o que exige cuidado e o que acontece na serra nas próximas semanas.
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                [Mountain, "Locais excepcionais", "Parques, picos e vales de Teresópolis."],
                [ShieldCheck, "Visita segura", "Avisos e status sempre atualizados."],
                [Leaf, "Natureza viva", "Biodiversidade da Mata Atlântica."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Mountain;
                return (
                  <li key={t as string}>
                    <I className="size-7 text-floresta-600" strokeWidth={1.4} aria-hidden />
                    <h3 className="mt-3 text-lg">{t as string}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Agenda</span>
            <h2 className="mt-4 text-4xl sm:text-5xl">
              Próximos <em className="text-terra-500">eventos</em>
            </h2>
          </div>
          <Link to="/eventos" className="btn-label inline-flex items-center gap-2 text-floresta-700 hover:text-terra-600">
            Ver agenda <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {events.loading && <div className="h-36 animate-pulse rounded-[var(--radius)] bg-pedra-200" />}
          {events.data?.slice(0, 4).map((e) => <EventCard key={e.id} e={e} />)}
        </div>
        {events.data?.length === 0 && <p className="text-muted-foreground">Nenhum evento programado no momento.</p>}
      </section>

      <section className="bg-floresta-800 text-pedra-50">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-4 py-16 sm:px-8">
          <div>
            <span className="eyebrow text-ambar-300">Planeje sua visita</span>
            <h2 className="mt-4 text-4xl sm:text-5xl">A serra está chamando.</h2>
            <p className="mt-3 max-w-md text-salvia-200">Confira o status das atrações antes de sair de casa e aproveite o melhor da montanha.</p>
          </div>
          <Button asChild className={`${pill} bg-pedra-50 text-floresta-800 hover:bg-salvia-100`}>
            <Link to="/atracoes">
              <Compass className="size-4" /> Ver atrações
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
