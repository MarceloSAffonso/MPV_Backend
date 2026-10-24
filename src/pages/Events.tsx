import { useState } from "react";
import { Search } from "lucide-react";
import { EventCard } from "@/components/Cards";
import { PageHeader } from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qs, useFetch } from "@/lib/api";
import type { TereEvent } from "@/lib/types";
import { useDebounced } from "@/pages/Attractions";
import { EVENT_CATEGORIES, LABELS } from "@/shared/constants";

export default function Events() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [past, setPast] = useState(false);
  const dq = useDebounced(q);
  const { data, loading, error } = useFetch<TereEvent[]>(
    `/events${qs({ q: dq, category: category === "all" ? "" : category, from, to, past: past ? "1" : "" })}`,
  );

  return (
    <>
      <PageHeader eyebrow="Agenda" title={<>Eventos na <em>serra</em></>}>
        Caminhadas, mutirões, feiras e encontros do Circuito Terê Verde. Filtre por data ou categoria.
      </PageHeader>

      <div className="mx-auto max-w-[1000px] px-4 py-10 sm:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]" role="search">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar evento" placeholder="Buscar evento" className="h-11 bg-card pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Categoria" className="h-11 w-full bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{LABELS[c]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input aria-label="A partir de" type="date" className="h-11 bg-card" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input aria-label="Até" type="date" className="h-11 bg-card" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="mb-6 flex items-center gap-2">
          <Checkbox id="past" checked={past} onCheckedChange={(v) => setPast(v === true)} />
          <Label htmlFor="past" className="font-normal text-muted-foreground">Incluir eventos que já aconteceram</Label>
        </div>

        {error && <p role="alert" className="text-destructive">Não foi possível carregar os eventos agora.</p>}
        <div className="space-y-4">
          {loading && !data && <div className="h-36 animate-pulse rounded-[var(--radius)] bg-pedra-200" />}
          {data?.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
        {data?.length === 0 && <p className="py-16 text-center text-muted-foreground">Nenhum evento encontrado para esses filtros.</p>}
      </div>
    </>
  );
}
