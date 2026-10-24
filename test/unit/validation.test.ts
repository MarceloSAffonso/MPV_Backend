import { describe, expect, it } from "vitest";
import { attractionSchema, emailSchema, eventSchema, loginSchema, passwordSchema, profileSchema, seasonSchema } from "../../src/worker/schemas";
import { effectiveStatus, slugify } from "../../src/worker/util";

const attraction = {
  name: "Pedra do Sino",
  category: "trilha",
  summary: "O ponto mais alto da Serra dos Órgãos.",
  location: "Teresópolis",
  status: "aberta",
};

describe("validação no servidor (RNF03)", () => {
  it("aceita uma atração válida e aplica padrões", () => {
    const r = attractionSchema.parse(attraction);
    expect(r.featured).toBe(false);
    expect(r.difficulty).toBeNull();
  });

  it("rejeita categoria e status fora da lista", () => {
    expect(attractionSchema.safeParse({ ...attraction, category: "praia" }).success).toBe(false);
    expect(attractionSchema.safeParse({ ...attraction, status: "quebrada" }).success).toBe(false);
  });

  it("rejeita campos obrigatórios vazios e resumo curto", () => {
    expect(attractionSchema.safeParse({ ...attraction, name: "" }).success).toBe(false);
    expect(attractionSchema.safeParse({ ...attraction, summary: "curto" }).success).toBe(false);
  });

  it("evento exige data AAAA-MM-DD e horário HH:MM", () => {
    const ev = { title: "Mutirão", location: "Parque", date: "2026-11-14", time: "08:00", category: "voluntariado", status: "publicado" };
    expect(eventSchema.safeParse(ev).success).toBe(true);
    expect(eventSchema.safeParse({ ...ev, date: "14/11/2026" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...ev, time: "8h" }).success).toBe(false);
  });

  it("temporada não pode terminar antes de começar", () => {
    const s = { name: "Verão", kind: "alta", start_date: "2026-12-20", end_date: "2026-12-10" };
    expect(seasonSchema.safeParse(s).success).toBe(false);
    expect(seasonSchema.safeParse({ ...s, end_date: "2027-02-28" }).success).toBe(true);
  });

  it("login normaliza o e-mail", () => {
    expect(loginSchema.parse({ email: "  ADMIN@Exemplo.COM ", password: "x" }).email).toBe("admin@exemplo.com");
  });
});

describe("filtro de caracteres do e-mail", () => {
  it.each(["admin@tereverde.local", "marcelo.souza+teste@exemplo.com.br", "a_b-c%d@sub-dominio.org"])("aceita %s", (email) => {
    expect(emailSchema.safeParse(email).success).toBe(true);
  });

  it.each(["joão@exemplo.com", "ana silva@exemplo.com", "ana@exemplo", "ana@@exemplo.com", "<script>@x.com", "ana@exemplo.com;drop", "a'b@exemplo.com", "ana@ex_emplo.com", ""])(
    "rejeita %s",
    (email) => {
      expect(emailSchema.safeParse(email).success).toBe(false);
    },
  );

  it("normaliza maiúsculas e espaços nas pontas", () => {
    expect(emailSchema.parse("  Marcelo@Exemplo.COM ")).toBe("marcelo@exemplo.com");
  });

  it("limita o tamanho a 254 caracteres", () => {
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.com`).success).toBe(false);
  });
});

describe("perfil e senha", () => {
  it("nome aceita acentos, apóstrofo e hífen, mas não símbolos nem números", () => {
    expect(profileSchema.safeParse({ name: "Marcelo Souza Affonso", email: "m@x.com" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: "D'Ávila-Silva Jr.", email: "m@x.com" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: "Marcelo <b>", email: "m@x.com" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "Admin123", email: "m@x.com" }).success).toBe(false);
  });

  it("nova senha exige 8+ caracteres com letra e número, e diferente da atual", () => {
    const ok = { current_password: "SenhaAntiga1", new_password: "SenhaNova2026" };
    expect(passwordSchema.safeParse(ok).success).toBe(true);
    expect(passwordSchema.safeParse({ ...ok, new_password: "curta1" }).success).toBe(false);
    expect(passwordSchema.safeParse({ ...ok, new_password: "somenteletras" }).success).toBe(false);
    expect(passwordSchema.safeParse({ ...ok, new_password: "12345678" }).success).toBe(false);
    expect(passwordSchema.safeParse({ ...ok, new_password: ok.current_password }).success).toBe(false);
  });
});

describe("utilitários", () => {
  it("slugify remove acentos e símbolos", () => {
    expect(slugify("Cachoeira do Papel — Teresópolis!")).toBe("cachoeira-do-papel-teresopolis");
  });

  it("temporada fechada sobrepõe o status cadastrado", () => {
    expect(effectiveStatus({ status: "aberta", season_closed: 1 }).status).toBe("fechada");
    expect(effectiveStatus({ status: "manutencao", season_closed: 0 }).status).toBe("manutencao");
  });
});
