import type { AttractionCategory, AttractionStatus, Difficulty, EventCategory, EventStatus, NoticeSeverity } from "@/shared/constants";

export interface Attraction {
  id: number;
  slug: string;
  name: string;
  category: AttractionCategory;
  summary: string;
  description: string;
  location: string;
  difficulty: Difficulty | null;
  distance_km: number | null;
  duration: string | null;
  altitude_m: number | null;
  status: AttractionStatus;
  safety_notes: string;
  image_key: string | null;
  image_credit: string | null;
  featured: number;
}

export interface AttractionDetail extends Attraction {
  events: TereEvent[];
  seasons: Season[];
}

export interface Season {
  id: number;
  name: string;
  kind: "alta" | "baixa" | "fechada";
  start_date: string;
  end_date: string;
  attraction_id: number | null;
  attraction_name?: string | null;
  attraction_slug?: string | null;
  notes: string;
}

export interface AuditEntry {
  id: number;
  user_email: string;
  action: string;
  entity: string;
  entity_id: number | null;
  detail: string | null;
  created_at: string;
}

export interface TereEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  category: EventCategory;
  status: EventStatus;
  image_key: string | null;
  attraction_id: number | null;
  attraction_name?: string | null;
  attraction_slug?: string | null;
}

export interface Notice {
  id: number;
  title: string;
  message: string;
  severity: NoticeSeverity;
  attraction_id: number | null;
  attraction_name?: string | null;
  attraction_slug?: string | null;
  active: number;
}

export interface Stats {
  attractions: number;
  open: number;
  restricted: number;
  events: number;
  upcoming: number;
  notices: number;
  seasons: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
}
