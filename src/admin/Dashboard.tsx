import { Navigate } from "react-router-dom";
import { CalendarDays, Mountain, ShieldAlert, TriangleAlert } from "lucide-react";
import { AdminHeader } from "@/admin/AdminHeader";
import { AttractionsManager } from "@/admin/AttractionsManager";
import { EventsManager } from "@/admin/EventsManager";
import { NoticesManager } from "@/admin/NoticesManager";
import { SeasonsManager } from "@/admin/SeasonsManager";
import { AuditLog } from "@/admin/AuditLog";
import { useSession } from "@/admin/session";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFetch } from "@/lib/api";
import type { Stats } from "@/lib/types";

export default function Dashboard() {
  const { user, loading } = useSession();
  const stats = useFetch<Stats>(user ? "/admin/stats" : null);

  if (loading) return <Skeleton className="m-8 h-40" />;
  if (!user) return <Navigate to="/admin/login" replace />;

  const s = stats.data;
  const cards = [
    { label: "Atrações", value: s?.attractions, sub: `${s?.open ?? "–"} abertas`, icon: Mountain },
    { label: "Com restrição", value: s?.restricted, sub: "fechadas ou em manutenção", icon: TriangleAlert },
    { label: "Eventos publicados", value: s?.events, sub: `${s?.upcoming ?? "–"} nos próximos 30 dias`, icon: CalendarDays },
    { label: "Avisos ativos", value: s?.notices, sub: "no topo do site", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-svh bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
        <span className="eyebrow">Painel</span>
        <h1 className="mb-8 mt-3 text-4xl">Terê Verde Online</h1>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, sub, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                  <p className="mt-2 font-serif text-4xl text-floresta-700">{value ?? "–"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                </div>
                <Icon className="size-6 text-musgo-500" strokeWidth={1.4} aria-hidden />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="atracoes">
          <TabsList className="mb-6 bg-pedra-200">
            <TabsTrigger value="atracoes">Atrações</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="temporadas">Temporadas</TabsTrigger>
            <TabsTrigger value="avisos">Avisos</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>
          <TabsContent value="atracoes"><AttractionsManager onChange={stats.reload} /></TabsContent>
          <TabsContent value="eventos"><EventsManager onChange={stats.reload} /></TabsContent>
          <TabsContent value="temporadas"><SeasonsManager onChange={stats.reload} /></TabsContent>
          <TabsContent value="avisos"><NoticesManager onChange={stats.reload} /></TabsContent>
          <TabsContent value="auditoria"><AuditLog /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
