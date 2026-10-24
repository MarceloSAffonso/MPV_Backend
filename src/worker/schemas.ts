import { z } from "zod";
import {
  ATTRACTION_CATEGORIES,
  ATTRACTION_STATUSES,
  DIFFICULTIES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  NOTICE_SEVERITIES,
  SEASON_KINDS,
} from "../shared/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-mail muito longo")
  .regex(EMAIL_PATTERN, "E-mail inválido. Use apenas letras sem acento, números e os símbolos . _ % + -");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha").max(200),
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome")
    .max(80, "Nome muito longo")
    .regex(/^\p{L}[\p{L}\p{M}' .-]*$/u, "O nome deve ter apenas letras, espaços, apóstrofo, ponto e hífen"),
  email: emailSchema,
});

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual").max(200),
    new_password: z
      .string()
      .min(8, "A nova senha deve ter ao menos 8 caracteres")
      .max(128, "A nova senha deve ter no máximo 128 caracteres")
      .regex(/[A-Za-z]/, "A nova senha deve ter ao menos uma letra")
      .regex(/\d/, "A nova senha deve ter ao menos um número"),
  })
  .refine((p) => p.new_password !== p.current_password, { message: "A nova senha deve ser diferente da atual" });

export const attractionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  category: z.enum(ATTRACTION_CATEGORIES),
  summary: z.string().trim().min(10, "Resumo muito curto (mín. 10 caracteres)").max(240),
  description: z.string().trim().max(4000).default(""),
  location: z.string().trim().min(2, "Informe o local").max(160),
  difficulty: z.enum(DIFFICULTIES).nullish().transform((v) => v ?? null),
  distance_km: z.number().min(0).max(500).nullish().transform((v) => v ?? null),
  duration: optionalText(60),
  altitude_m: z.number().int().min(0).max(4000).nullish().transform((v) => v ?? null),
  status: z.enum(ATTRACTION_STATUSES),
  safety_notes: z.string().trim().max(1500).default(""),
  image_key: optionalText(200),
  image_credit: optionalText(200),
  featured: z.boolean().default(false),
});

export const statusSchema = z.object({ status: z.enum(ATTRACTION_STATUSES) });

export const eventSchema = z.object({
  title: z.string().trim().min(3, "Informe o título").max(140),
  description: z.string().trim().max(2000).default(""),
  location: z.string().trim().min(2, "Informe o local").max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  category: z.enum(EVENT_CATEGORIES),
  status: z.enum(EVENT_STATUSES),
  image_key: optionalText(200),
  attraction_id: z.number().int().positive().nullish().transform((v) => v ?? null),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

export const seasonSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome").max(120),
    kind: z.enum(SEASON_KINDS),
    start_date: isoDate,
    end_date: isoDate,
    attraction_id: z.number().int().positive().nullish().transform((v) => v ?? null),
    notes: z.string().trim().max(500).default(""),
  })
  .refine((s) => s.end_date >= s.start_date, { message: "A data final deve ser igual ou posterior à inicial" });

export const noticeSchema = z.object({
  title: z.string().trim().min(3, "Informe o título").max(120),
  message: z.string().trim().min(3, "Informe a mensagem").max(500),
  severity: z.enum(NOTICE_SEVERITIES),
  attraction_id: z.number().int().positive().nullish().transform((v) => v ?? null),
  active: z.boolean().default(true),
});
