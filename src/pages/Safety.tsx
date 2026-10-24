import { Link } from "react-router-dom";
import { AlertTriangle, Backpack, CloudRain, Droplets, Info, Phone, ShieldAlert, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate, useFetch } from "@/lib/api";
import type { Attraction, Notice, Season } from "@/lib/types";
import { LABELS } from "@/shared/constants";

const TIPS = [
  [CloudRain, "Confira o tempo", "A serra muda rápido. Evite trilhas com chuva forte ou neblina densa."],
  [Backpack, "Leve o essencial", "Água, lanche, agasalho, capa de chuva, lanterna e protetor solar."],
  [Droplets, "Cuidado com pedras molhadas", "Use calçado com boa aderência perto de cachoeiras e rios."],
  [Trash2, "Não deixe rastros", "Traga seu lixo de volta e respeite a fauna e a flora."],
  [Info, "Siga as regras do parque", "Horários, limites de visitantes e áreas restritas existem para proteger você e a mata."],
  [Phone, "Avise alguém", "Conte seu roteiro e horário previsto de volta a uma pessoa de confiança."],
] as const;

const SEVERITY: Record<string, string> = {
  urgente: "border-terra-300 bg-[#f9e8dc]",
  alerta: "border-ambar-300 bg-[#fbf1da]",
  info: "border-nevoa-300 bg-nevoa-100",
};

export default function Safety() {
  const notices = useFetch<Notice[]>("/notices");
  const restricted = useFetch<Attraction[]>("/attractions");
  const seasons = useFetch<Season[]>("/seasons");
  const list = restricted.data?.filter((a) => a.status !== "aberta") ?? [];

  return (
    <>
      <PageHeader eyebrow="Segurança" title={<>Visite com <em>cuidado</em></>}>
        Avisos atualizados, atrações com acesso restrito e orientações essenciais antes de subir a serra.
      </PageHeader>

      <div className="mx-auto max-w-[1000px] space-y-14 px-4 py-12 sm:px-8">
        <section aria-labelledby="avisos">
          <h2 id="avisos" className="mb-5 text-3xl">Avisos ativos</h2>
          <div className="space-y-3">
            {notices.data?.map((n) => (
              <Alert key={n.id} className={SEVERITY[n.severity]}>
                {n.severity === "urgente" ? <ShieldAlert className="size-4" /> : <AlertTriangle className="size-4" />}
                <AlertTitle>{n.title}</AlertTitle>
                <AlertDescription>
                  {n.message}{" "}
                  {n.attraction_slug && <Link to={`/atracoes/${n.attraction_slug}`} className="font-semibold underline underline-offset-4">Ver atração</Link>}
                </AlertDescription>
              </Alert>
            ))}
            {notices.data?.length === 0 && <p className="text-muted-foreground">Nenhum aviso ativo no momento.</p>}
          </div>
        </section>

        <section aria-labelledby="temporadas">
          <h2 id="temporadas" className="mb-5 text-3xl">Temporadas</h2>
          <ul className="divide-y rounded-[var(--radius)] border bg-card">
            {seasons.data?.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.attraction_name ?? "Circuito inteiro"}{s.notes ? ` · ${s.notes}` : ""}</p>
                </div>
                <div className="text-right text-sm">
                  <span className={s.kind === "fechada" ? "font-semibold text-terra-600" : "font-semibold text-floresta-700"}>{LABELS[s.kind]}</span>
                  <p className="text-muted-foreground">{formatDate(s.start_date).toLocaleDateString("pt-BR")} a {formatDate(s.end_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </li>
            ))}
            {seasons.data?.length === 0 && <li className="p-4 text-muted-foreground">Nenhuma temporada programada.</li>}
          </ul>
        </section>

        <section aria-labelledby="restritas">
          <h2 id="restritas" className="mb-5 text-3xl">Acesso restrito</h2>
          <ul className="divide-y rounded-[var(--radius)] border bg-card">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                <Link to={`/atracoes/${a.slug}`} className="font-medium hover:text-terra-600">{a.name}</Link>
                <StatusBadge status={a.status} />
              </li>
            ))}
            {restricted.data && list.length === 0 && <li className="p-4 text-muted-foreground">Todas as atrações estão abertas.</li>}
          </ul>
        </section>

        <section aria-labelledby="dicas">
          <h2 id="dicas" className="mb-5 text-3xl">Antes de sair</h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {TIPS.map(([Icon, t, d]) => (
              <li key={t} className="flex gap-4 rounded-[var(--radius)] border bg-card p-5">
                <Icon className="mt-1 size-6 shrink-0 text-floresta-600" strokeWidth={1.4} aria-hidden />
                <div>
                  <h3 className="text-xl">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--radius)] bg-floresta-800 p-8 text-pedra-50">
          <h2 className="text-3xl">Em caso de emergência</h2>
          <p className="mt-2 text-salvia-200">Mantenha a calma, informe sua localização e ligue:</p>
          <div className="mt-5 flex flex-wrap gap-4">
            {[["193", "Bombeiros"], ["192", "SAMU"], ["190", "Polícia Militar"]].map(([n, l]) => (
              <a key={n} href={`tel:${n}`} className="rounded-xl border border-pedra-50/30 px-6 py-3 hover:bg-pedra-50 hover:text-floresta-800">
                <span className="font-serif text-3xl">{n}</span> <span className="ml-2 text-sm">{l}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
