import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, EnumSelect, Field } from "@/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, formatDate, useFetch } from "@/lib/api";
import type { Attraction, Season } from "@/lib/types";
import { LABELS, SEASON_KINDS } from "@/shared/constants";

const EMPTY = { name: "", kind: "alta", start_date: "", end_date: "", attraction_id: null as string | null, notes: "" };
type Form = typeof EMPTY;
const fmt = (d: string) => formatDate(d).toLocaleDateString("pt-BR");

export function SeasonsManager({ onChange }: { onChange: () => void }) {
  const { data, loading, reload } = useFetch<Season[]>("/admin/seasons");
  const attractions = useFetch<Attraction[]>("/admin/attractions");
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);
  const [deleting, setDeleting] = useState<Season | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => (reload(), onChange());
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((s) => s && { ...s, form: { ...s.form, [k]: v } });
  const f = editing?.form;
  const labels = Object.fromEntries((attractions.data ?? []).map((a) => [String(a.id), a.name]));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const body = { ...editing.form, attraction_id: editing.form.attraction_id ? Number(editing.form.attraction_id) : null };
      await api(editing.id ? `/admin/seasons/${editing.id}` : "/admin/seasons", { method: editing.id ? "PUT" : "POST", json: body });
      toast.success("Temporada salva");
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
      <p className="mb-4 text-sm text-muted-foreground">
        Temporadas <strong>fechadas</strong> bloqueiam automaticamente a atração (ou o circuito inteiro) no período; altas e baixas aparecem como orientação aos visitantes.
      </p>
      <div className="mb-4 flex justify-end">
        <Button className="btn-label rounded-full" onClick={() => setEditing({ id: null, form: EMPTY })}><Plus className="size-4" /> Nova temporada</Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Temporada</TableHead><TableHead>Tipo</TableHead><TableHead>Período</TableHead><TableHead>Vale para</TableHead><TableHead className="w-28 text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell><Badge variant={s.kind === "fechada" ? "destructive" : "secondary"}>{LABELS[s.kind]}</Badge></TableCell>
                <TableCell className="whitespace-nowrap">{fmt(s.start_date)} a {fmt(s.end_date)}</TableCell>
                <TableCell>{s.attraction_name ?? "Circuito inteiro"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label={`Editar ${s.name}`} onClick={() => setEditing({ id: s.id, form: { name: s.name, kind: s.kind, start_date: s.start_date, end_date: s.end_date, attraction_id: s.attraction_id?.toString() ?? null, notes: s.notes } })}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Desativar ${s.name}`} onClick={() => setDeleting(s)}><Trash2 className="size-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar temporada" : "Nova temporada"}</DialogTitle>
            <DialogDescription>Defina o período e a quem ele se aplica.</DialogDescription>
          </DialogHeader>
          {f && (
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nome" htmlFor="s-name"><Input id="s-name" required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
              <Field label="Tipo"><EnumSelect value={f.kind} onChange={(v) => set("kind", v ?? "alta")} options={SEASON_KINDS} /></Field>
              <Field label="Vale para">
                <EnumSelect value={f.attraction_id} onChange={(v) => set("attraction_id", v)} allowNone="Circuito inteiro" labels={labels} options={(attractions.data ?? []).map((a) => String(a.id))} />
              </Field>
              <Field label="Início" htmlFor="s-start"><Input id="s-start" type="date" required value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
              <Field label="Fim" htmlFor="s-end"><Input id="s-end" type="date" required value={f.end_date} onChange={(e) => set("end_date", e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Observações" htmlFor="s-notes"><Textarea id="s-notes" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field></div>
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
            await api(`/admin/seasons/${deleting!.id}`, { method: "DELETE" });
            toast.success("Temporada desativada");
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
