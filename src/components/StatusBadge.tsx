import { CircleCheck, CircleX, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LABELS } from "@/shared/constants";
import { cn } from "@/lib/utils";

const STYLE: Record<string, { cls: string; icon: typeof CircleCheck }> = {
  aberta: { cls: "bg-salvia-100 text-floresta-700 border-musgo-300", icon: CircleCheck },
  fechada: { cls: "bg-[#f4dccb] text-terra-600 border-terra-300", icon: CircleX },
  manutencao: { cls: "bg-[#f7e9c8] text-[#8a5f12] border-ambar-300", icon: Wrench },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STYLE[status] ?? STYLE.aberta;
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider", s.cls, className)}>
      <Icon className="size-3.5" aria-hidden />
      {LABELS[status] ?? status}
    </Badge>
  );
}
