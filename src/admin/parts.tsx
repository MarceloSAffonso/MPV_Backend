import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, mediaUrl } from "@/lib/api";
import { LABELS } from "@/shared/constants";

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EnumSelect({ id, value, onChange, options, allowNone, labels }: { id?: string; value: string | null; onChange: (v: string | null) => void; options: readonly string[]; allowNone?: string; labels?: Record<string, string> }) {
  return (
    <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? null : v)}>
      <SelectTrigger id={id} className="w-full bg-background"><SelectValue /></SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="none">{allowNone}</SelectItem>}
        {options.map((o) => <SelectItem key={o} value={o}>{labels?.[o] ?? LABELS[o] ?? o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function ImageField({ value, onChange }: { value: string | null; onChange: (key: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { key } = await api<{ key: string }>("/admin/upload", { method: "POST", body: fd });
      onChange(key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Imagem (JPG, PNG ou WebP, até 3 MB)</Label>
      <div className="flex items-center gap-3">
        {value && <img src={mediaUrl(value)!} alt="Pré-visualização" className="h-16 w-24 rounded-md object-cover" />}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="image-upload" onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {value ? "Trocar" : "Enviar imagem"}
        </Button>
        {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}><X className="size-4" /> Remover</Button>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ConfirmDelete({ open, name, onCancel, onConfirm }: { open: boolean; name: string; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar registro?</DialogTitle>
          <DialogDescription>“{name}” deixará de aparecer no site. O histórico é mantido para auditoria.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Desativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
