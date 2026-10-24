import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, EnumSelect, Field, ImageField } from "@/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, formatDate, useFetch } from "@/lib/api";
import type { Attraction, TereEvent } from "@/lib/types";
import { EVENT_CATEGORIES, EVENT_STATUSES, LABELS } from "@/shared/constants";

const EMPTY = { title: "", description: "", location: "", date: "", time: "09:00", category: "caminhada", status: "rascunho", image_key: null as string | null, attraction_id: null as string | null };
type Form = typeof EMPTY;

export function EventsManager({ onChange }: { onChange: () => void }) {
  const { data, loading, reload } = useFetch<TereEvent[]>("/admin/events");
  const attractions = useFetch<Attraction[]>("/admin/attractions");
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);
  const [deleting, setDeleting] = useState<TereEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => (reload(), onChange());
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((s) => s && { ...s, form: { ...s.form, [k]: v } });
  const f = editing?.form;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const body = { ...editing.form, attraction_id: editing.form.attraction_id ? Number(editing.form.attraction_id) : null };
      await api(editing.id ? `/admin/events/${editing.id}` : "/admin/events", { method: editing.id ? "PUT" : "POST", json: body });
      toast.success("Evento salvo");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button className="btn-label rounded-full" onClick={() => setEditing({ id: null, form: EMPTY })}><Plus className="size-4" /> Novo evento</Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Evento</TableHead><TableHead>Data</TableHead><TableHead>Categoria</TableHead><TableHead>Situação</TableHead><TableHead className="w-28 text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="font-medium">{ev.title}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(ev.date).toLocaleDateString("pt-BR")} · {ev.time}</TableCell>
                <TableCell>{LABELS[ev.category]}</TableCell>
                <TableCell><Badge variant={ev.status === "publicado" ? "default" : "secondary"}>{LABELS[ev.status]}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label={`Editar ${ev.title}`} onClick={() => setEditing({ id: ev.id, form: { title: ev.title, description: ev.description, location: ev.location, date: ev.date, time: ev.time, category: ev.category, status: ev.status, image_key: ev.image_key, attraction_id: ev.attraction_id?.toString() ?? null } })}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Desativar ${ev.title}`} onClick={() => setDeleting(ev)}><Trash2 className="size-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar evento" : "Novo evento"}</DialogTitle>
            <DialogDescription>Eventos “Publicados” aparecem na agenda pública; “Rascunho” fica só aqui.</DialogDescription>
          </DialogHeader>
          {f && (
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Título" htmlFor="e-title"><Input id="e-title" required value={f.title} onChange={(e) => set("title", e.target.value)} /></Field></div>
              <Field label="Data" htmlFor="e-date"><Input id="e-date" type="date" required value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
              <Field label="Horário" htmlFor="e-time"><Input id="e-time" type="time" required value={f.time} onChange={(e) => set("time", e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Local" htmlFor="e-loc"><Input id="e-loc" required value={f.location} onChange={(e) => set("location", e.target.value)} /></Field></div>
              <Field label="Categoria"><EnumSelect value={f.category} onChange={(v) => set("category", v ?? "caminhada")} options={EVENT_CATEGORIES} /></Field>
              <Field label="Situação"><EnumSelect value={f.status} onChange={(v) => set("status", v ?? "rascunho")} options={EVENT_STATUSES} /></Field>
              <div className="sm:col-span-2">
                <Field label="Atração relacionada">
                  <EnumSelect value={f.attraction_id} onChange={(v) => set("attraction_id", v)} allowNone="Nenhuma" labels={Object.fromEntries((attractions.data ?? []).map((a) => [String(a.id), a.name]))} options={(attractions.data ?? []).map((a) => String(a.id))} />
                </Field>
              </div>
              <div className="sm:col-span-2"><Field label="Descrição" htmlFor="e-desc"><Textarea id="e-desc" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><ImageField value={f.image_key} onChange={(k) => set("image_key", k)} /></div>
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
        name={deleting?.title ?? ""}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await api(`/admin/events/${deleting!.id}`, { method: "DELETE" });
            toast.success("Evento desativado");
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
