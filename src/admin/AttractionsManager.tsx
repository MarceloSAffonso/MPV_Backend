import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, EnumSelect, Field, ImageField } from "@/admin/parts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, useFetch } from "@/lib/api";
import type { Attraction } from "@/lib/types";
import { ATTRACTION_CATEGORIES, ATTRACTION_STATUSES, DIFFICULTIES, LABELS } from "@/shared/constants";

const EMPTY = {
  name: "", category: "trilha", summary: "", description: "", location: "", difficulty: null as string | null,
  distance_km: "", duration: "", altitude_m: "", status: "aberta", safety_notes: "", image_key: null as string | null, image_credit: "", featured: false,
};
type Form = typeof EMPTY;

const toForm = (a: Attraction): Form => ({
  name: a.name, category: a.category, summary: a.summary, description: a.description, location: a.location, difficulty: a.difficulty,
  distance_km: a.distance_km?.toString() ?? "", duration: a.duration ?? "", altitude_m: a.altitude_m?.toString() ?? "",
  status: a.status, safety_notes: a.safety_notes, image_key: a.image_key, image_credit: a.image_credit ?? "", featured: !!a.featured,
});

export function AttractionsManager({ onChange }: { onChange: () => void }) {
  const { data, loading, reload } = useFetch<Attraction[]>("/admin/attractions");
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);
  const [deleting, setDeleting] = useState<Attraction | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => (reload(), onChange());

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const f = editing.form;
    setBusy(true);
    try {
      const body = {
        ...f,
        distance_km: f.distance_km === "" ? null : Number(f.distance_km),
        altitude_m: f.altitude_m === "" ? null : Number(f.altitude_m),
      };
      await api(editing.id ? `/admin/attractions/${editing.id}` : "/admin/attractions", { method: editing.id ? "PUT" : "POST", json: body });
      toast.success("Atração salva");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(a: Attraction, status: string | null) {
    if (!status) return;
    try {
      await api(`/admin/attractions/${a.id}/status`, { method: "PATCH", json: { status } });
      toast.success(`${a.name}: ${LABELS[status]}`);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((s) => s && { ...s, form: { ...s.form, [k]: v } });
  const f = editing?.form;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button className="btn-label rounded-full" onClick={() => setEditing({ id: null, form: EMPTY })}><Plus className="size-4" /> Nova atração</Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead className="w-48">Disponibilidade</TableHead><TableHead className="w-28 text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{LABELS[a.category]}</TableCell>
                <TableCell><EnumSelect value={a.status} onChange={(v) => setStatus(a, v)} options={ATTRACTION_STATUSES} /></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label={`Editar ${a.name}`} onClick={() => setEditing({ id: a.id, form: toForm(a) })}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Desativar ${a.name}`} onClick={() => setDeleting(a)}><Trash2 className="size-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar atração" : "Nova atração"}</DialogTitle>
            <DialogDescription>Estas informações aparecem na página pública da atração.</DialogDescription>
          </DialogHeader>
          {f && (
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nome" htmlFor="a-name"><Input id="a-name" required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
              <Field label="Categoria"><EnumSelect value={f.category} onChange={(v) => set("category", v ?? "trilha")} options={ATTRACTION_CATEGORIES} /></Field>
              <Field label="Disponibilidade"><EnumSelect value={f.status} onChange={(v) => set("status", v ?? "aberta")} options={ATTRACTION_STATUSES} /></Field>
              <div className="sm:col-span-2"><Field label="Resumo" htmlFor="a-sum" hint="Até 240 caracteres."><Input id="a-sum" required value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><Field label="Local" htmlFor="a-loc"><Input id="a-loc" required value={f.location} onChange={(e) => set("location", e.target.value)} /></Field></div>
              <Field label="Dificuldade"><EnumSelect value={f.difficulty} onChange={(v) => set("difficulty", v)} options={DIFFICULTIES} allowNone="Não se aplica" /></Field>
              <Field label="Duração" htmlFor="a-dur"><Input id="a-dur" placeholder="Ex.: 2 h (ida e volta)" value={f.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
              <Field label="Distância (km)" htmlFor="a-dist"><Input id="a-dist" type="number" min="0" step="0.1" value={f.distance_km} onChange={(e) => set("distance_km", e.target.value)} /></Field>
              <Field label="Altitude (m)" htmlFor="a-alt"><Input id="a-alt" type="number" min="0" value={f.altitude_m} onChange={(e) => set("altitude_m", e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Descrição" htmlFor="a-desc"><Textarea id="a-desc" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><Field label="Orientações de segurança" htmlFor="a-safe"><Textarea id="a-safe" rows={3} value={f.safety_notes} onChange={(e) => set("safety_notes", e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><ImageField value={f.image_key} onChange={(k) => set("image_key", k)} /></div>
              <div className="sm:col-span-2"><Field label="Crédito da imagem" htmlFor="a-credit" hint="Obrigatório para fotos com licença livre (autor, licença, fonte)."><Input id="a-credit" placeholder="Foto: Nome · CC BY 4.0 · Wikimedia Commons" value={f.image_credit} onChange={(e) => set("image_credit", e.target.value)} /></Field></div>
              <label className="flex items-center gap-3 text-sm sm:col-span-2"><Switch checked={f.featured} onCheckedChange={(v) => set("featured", v)} /> Destacar na página inicial</label>
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        name={deleting?.name ?? ""}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await api(`/admin/attractions/${deleting!.id}`, { method: "DELETE" });
            toast.success("Atração desativada");
            setDeleting(null);
            refresh();
          } catch (err) {
            toast.error((err as Error).message);
          }
        }}
      />
    </div>
  );
}
