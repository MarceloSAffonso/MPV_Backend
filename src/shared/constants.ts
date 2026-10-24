export const ATTRACTION_CATEGORIES = ["trilha", "cachoeira", "mirante", "parque", "biodiversidade"] as const;
export const ATTRACTION_STATUSES = ["aberta", "fechada", "manutencao"] as const;
export const DIFFICULTIES = ["facil", "moderada", "dificil"] as const;
export const EVENT_CATEGORIES = ["caminhada", "voluntariado", "cultura", "gastronomia", "educacao"] as const;
export const EVENT_STATUSES = ["publicado", "rascunho"] as const;
export const NOTICE_SEVERITIES = ["info", "alerta", "urgente"] as const;
export const SEASON_KINDS = ["alta", "baixa", "fechada"] as const;

export type AttractionCategory = (typeof ATTRACTION_CATEGORIES)[number];
export type AttractionStatus = (typeof ATTRACTION_STATUSES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type NoticeSeverity = (typeof NOTICE_SEVERITIES)[number];

export const LABELS: Record<string, string> = {
  trilha: "Trilha",
  cachoeira: "Cachoeira",
  mirante: "Mirante",
  parque: "Parque",
  biodiversidade: "Biodiversidade",
  aberta: "Aberta",
  fechada: "Fechada",
  manutencao: "Em manutenção",
  facil: "Fácil",
  moderada: "Moderada",
  dificil: "Difícil",
  caminhada: "Caminhada",
  voluntariado: "Voluntariado",
  cultura: "Cultura",
  gastronomia: "Gastronomia",
  educacao: "Educação",
  publicado: "Publicado",
  rascunho: "Rascunho",
  info: "Informativo",
  alerta: "Alerta",
  urgente: "Urgente",
  alta: "Alta temporada",
  baixa: "Baixa temporada",
};
