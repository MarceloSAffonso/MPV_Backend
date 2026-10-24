import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, EnumSelect, Field } from "@/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, useFetch } from "@/lib/api";
import type { Attraction, Notice } from "@/lib/types";
import { LABELS, NOTICE_SEVERITIES } from "@/shared/constants";

const EMPTY = { title: "", message: "", severity: "alerta", attraction_id: null as string | null, active: true };
type Form = typeof EMPTY;

export function NoticesManager({ onChange }: { onChange: () => void }) {
  const { data, loading, reload } = useFetch<Notice[]>("/admin/notices");
  const attractions = useFetch<Attraction[]>("/admin/attractions");
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);
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
      await api(editing.id ? `/admin/notices/${editing.id}` : "/admin/notices", { method: editing.id ? "PUT" : "POST", json: body });
      toast.success("Aviso salvo");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(n: Notice, active: boolean) {
    try {
      await api(`/admin/notices/${n.id}`, { method: "PUT", json: { title: n.title, message: n.message, severity: n.severity, attraction_id: n.attraction_id, active } });
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button className="btn-label rounded-full" onClick={() => setEditing({ id: null, form: EMPTY })}><Plus className="size-4" /> Novo aviso</Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius)] border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Aviso</TableHead><TableHead>Gravidade</TableHead><TableHead className="w-24">Ativo</TableHead><TableHead className="w-28 text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <div className="font-medium">{n.title}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{n.attraction_name ? `${n.attraction_name} · ` : ""}{n.message}</div>
                </TableCell>
                <TableCell><Badge variant={n.severity === "urgente" ? "destructive" : "secondary"}>{LABELS[n.severity]}</Badge></TableCell>
                <TableCell><Switch aria-label={`Aviso ativo: ${n.title}`} checked={!!n.active} onCheckedChange={(v) => toggle(n, v)} /></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label={`Editar ${n.title}`} onClick={() => setEditing({ id: n.id, form: { title: n.title, message: n.message, severity: n.severity, attraction_id: n.attraction_id?.toString() ?? null, active: !!n.active } })}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Desativar ${n.title}`} onClick={() => setDeleting(n)}><Trash2 className="size-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar aviso" : "Novo aviso"}</DialogTitle>
            <DialogDescription>Avisos ativos aparecem em destaque no topo de todas as páginas públicas.</DialogDescription>
          </DialogHeader>
          {f && (
            <form onSubmit={save} className="grid gap-4">
              <Field label="Título" htmlFor="n-title"><Input id="n-title" required value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
              <Field label="Mensagem" htmlFor="n-msg" hint="Até 500 caracteres."><Textarea id="n-msg" required rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gravidade"><EnumSelect value={f.severity} onChange={(v) => set("severity", v ?? "info")} options={NOTICE_SEVERITIES} /></Field>
                <Field label="Atração relacionada">
                  <EnumSelect value={f.attraction_id} onChange={(v) => set("attraction_id", v)} allowNone="Nenhuma" labels={Object.fromEntries((attractions.data ?? []).map((a) => [String(a.id), a.name]))} options={(attractions.data ?? []).map((a) => String(a.id))} />
                </Field>
              </div>
              <label className="flex items-center gap-3 text-sm"><Switch checked={f.active} onCheckedChange={(v) => set("active", v)} /> Aviso ativo</label>
              <DialogFooter>
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
            await api(`/admin/notices/${deleting!.id}`, { method: "DELETE" });
            toast.success("Aviso desativado");
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
