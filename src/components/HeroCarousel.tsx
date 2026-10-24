import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { mediaUrl } from "@/lib/api";
import type { Attraction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LABELS } from "@/shared/constants";

const INTERVAL_MS = 5000;
const MAX_SLIDES = 6;
const MIN_RATIO = 1.3;

interface Slide {
  key: string;
  src: string;
  alt: string;
  title?: string;
  kind?: string;
  slug?: string;
  credit?: string | null;
}

const FALLBACK: Slide = {
  key: "fallback",
  src: "/photos/hero.jpg",
  alt: "Dedo de Deus, Serra dos Órgãos, Teresópolis",
  title: "Dedo de Deus",
  kind: "Mirante",
  slug: "dedo-de-deus",
  credit: "Foto: Rogério Santana · CC BY 2.0 BR · Wikimedia Commons",
};

export function HeroCarousel({ attractions }: { attractions: Attraction[] | null }) {
  const candidates = useMemo<Slide[]>(() => {
    const order = ["trilha", "mirante", "cachoeira", "parque"];
    return (attractions ?? [])
      .filter((a) => a.image_key && a.category !== "biodiversidade")
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
      .map((a) => ({
        key: a.slug,
        src: mediaUrl(a.image_key)!,
        alt: `${a.name}, Teresópolis`,
        title: a.name,
        kind: LABELS[a.category],
        slug: a.slug,
        credit: a.image_credit,
      }));
  }, [attractions]);

  const [ratios, setRatios] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (candidates.length === 0) return;
    let alive = true;
    Promise.all(
      candidates.map(
        (s) =>
          new Promise<[string, number]>((resolve) => {
            const img = new Image();
            img.onload = () => resolve([s.key, img.naturalWidth / img.naturalHeight]);
            img.onerror = () => resolve([s.key, 0]);
            img.src = s.src;
          }),
      ),
    ).then((pairs) => alive && setRatios(Object.fromEntries(pairs)));
    return () => {
      alive = false;
    };
  }, [candidates]);

  const slides = useMemo<Slide[]>(() => {
    if (!ratios) return [FALLBACK];
    const horizontal = candidates.filter((s) => (ratios[s.key] ?? 0) >= MIN_RATIO).slice(0, MAX_SLIDES);
    return horizontal.length > 0 ? horizontal : [FALLBACK];
  }, [candidates, ratios]);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const reduceMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const plugins = useMemo(
    () => (reduceMotion || slides.length < 2 ? [] : [Autoplay({ delay: INTERVAL_MS, stopOnInteraction: false, stopOnMouseEnter: true })]),
    [reduceMotion, slides.length],
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const active = slides[Math.min(current, slides.length - 1)];

  return (
    <>
      <Carousel key={slides.map((s) => s.key).join()} setApi={setApi} plugins={plugins} opts={{ loop: true }} className="absolute inset-0 -z-10 h-full [&_[data-slot=carousel-content]]:h-full" aria-label="Fotos das principais trilhas de Teresópolis">
        <CarouselContent className="ml-0 h-full">
          {slides.map((s, i) => (
            <CarouselItem key={s.key} className="h-full basis-full pl-0" aria-label={`${i + 1} de ${slides.length}`}>
              <img src={s.src} alt={s.alt} className="h-full w-full object-cover object-[center_40%]" fetchPriority={i === 0 ? "high" : "low"} loading={i === 0 ? "eager" : "lazy"} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(20_38_27/0.88)_10%,rgb(20_38_27/0.2)_75%),linear-gradient(180deg,transparent_50%,rgb(20_38_27/0.7))]" />
      </Carousel>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-4 px-4 pb-5 text-pedra-50 sm:px-8">
          <div className="min-w-0">
            {active.slug && (
              <Link to={`/atracoes/${active.slug}`} className="group inline-flex items-center gap-2 text-sm font-medium">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-ambar-300">{active.kind}</span>
                <span className="font-serif text-lg">{active.title}</span>
                <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
              </Link>
            )}
            {slides.length > 1 && (
              <div className="mt-3 flex gap-2" role="tablist" aria-label="Escolher foto">
                {slides.map((s, i) => (
                  <button
                    key={s.key}
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Foto ${i + 1}: ${s.title ?? ""}`}
                    onClick={() => api?.scrollTo(i)}
                    className={cn("h-1.5 rounded-full transition-all duration-300", i === current ? "w-8 bg-pedra-50" : "w-3 bg-pedra-50/45 hover:bg-pedra-50/75")}
                  />
                ))}
              </div>
            )}
          </div>
          {active.credit && <p className="text-[0.65rem] text-pedra-50/70">{active.credit}</p>}
        </div>
      </div>
    </>
  );
}
