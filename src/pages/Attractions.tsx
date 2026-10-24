import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AttractionCard, CardGridSkeleton } from "@/components/Cards";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qs, useFetch } from "@/lib/api";
import type { Attraction } from "@/lib/types";
import { ATTRACTION_CATEGORIES, ATTRACTION_STATUSES, LABELS } from "@/shared/constants";

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Attractions() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const dq = useDebounced(q);
  const { data, loading, error } = useFetch<Attraction[]>(
    `/attractions${qs({ q: dq, category: category === "all" ? "" : category, status: status === "all" ? "" : status })}`,
  );

  return (
    <>
      <PageHeader eyebrow="Atrações" title={<>Trilhas, cachoeiras e <em>biodiversidade</em></>}>
        Descubra os destinos do Circuito Terê Verde e veja, em cada um, se o acesso está aberto, fechado ou em manutenção.
      </PageHeader>

      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_200px_200px]" role="search">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar atração" placeholder="Buscar por nome ou local" className="h-11 bg-card pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Categoria" className="h-11 w-full bg-card"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {ATTRACTION_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{LABELS[c]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Status" className="h-11 w-full bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer status</SelectItem>
              {ATTRACTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {error && <p role="alert" className="text-destructive">Não foi possível carregar as atrações. Tente novamente em instantes.</p>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && !data ? <CardGridSkeleton count={6} /> : data?.map((a) => <AttractionCard key={a.id} a={a} />)}
        </div>
        {data?.length === 0 && <p className="py-16 text-center text-muted-foreground">Nenhuma atração encontrada com esses filtros.</p>}
      </div>
    </>
  );
}
