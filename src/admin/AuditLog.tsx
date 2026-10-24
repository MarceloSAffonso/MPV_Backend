import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFetch } from "@/lib/api";
import type { AuditEntry } from "@/lib/types";

export function AuditLog() {
  const { data, loading } = useFetch<AuditEntry[]>("/admin/audit");
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Registro das últimas 100 alterações feitas no painel (quem, o quê e quando).</p>
      <div className="overflow-x-auto rounded-[var(--radius)] border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Quando (UTC)</TableHead><TableHead>Quem</TableHead><TableHead>Ação</TableHead><TableHead>Registro</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nenhuma alteração registrada ainda.</TableCell></TableRow>}
            {data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-xs">{a.created_at}</TableCell>
                <TableCell>{a.user_email}</TableCell>
                <TableCell><Badge variant={a.action === "desativar" ? "destructive" : "secondary"}>{a.action}</Badge></TableCell>
                <TableCell>{a.entity}{a.entity_id != null ? ` #${a.entity_id}` : ""}{a.detail ? ` — ${a.detail}` : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
