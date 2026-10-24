import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../../src/worker/index";
import { hashPassword } from "../../src/worker/auth";

const ADMIN = { email: "teste@tereverde.local", password: "senha-de-teste-123" };
let n = 0;

async function call(path: string, init: RequestInit & { json?: unknown; cookie?: string } = {}) {
  const { json, cookie, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (json !== undefined) headers.set("Content-Type", "application/json");
  if (cookie) headers.set("Cookie", cookie);
  const url = `http://localhost${path}${path.includes("?") ? "&" : "?"}_=${++n}`;
  const ctx = createExecutionContext();
  const res = await app.fetch(new Request(url, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body }), env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

async function login() {
  const res = await call("/api/auth/login", { method: "POST", json: ADMIN });
  expect(res.status).toBe(200);
  return res.headers.get("set-cookie")!.split(";")[0];
}

const newAttraction = {
  name: "Mirante de Teste",
  category: "mirante",
  summary: "Um mirante criado pelos testes de integração.",
  location: "Teresópolis",
  status: "aberta",
};

beforeAll(async () => {
  await env.DB.prepare("INSERT INTO users (email, name, password_hash) VALUES (?,?,?)")
    .bind(ADMIN.email, "Admin de Teste", await hashPassword(ADMIN.password))
    .run();
});

describe("consulta pública (visitantes)", () => {
  it("lista as atrações de exemplo sem exigir login", async () => {
    const res = await call("/api/attractions");
    expect(res.status).toBe(200);
    const list = (await res.json()) as { slug: string }[];
    expect(list.length).toBeGreaterThanOrEqual(7);
    expect(list.map((a) => a.slug)).toContain("pedra-do-sino");
  });

  it("filtra por categoria", async () => {
    const list = (await (await call("/api/attractions?category=parque")).json()) as { category: string }[];
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.category === "parque")).toBe(true);
  });

  it("devolve 404 para atração inexistente", async () => {
    expect((await call("/api/attractions/nao-existe")).status).toBe(404);
  });

  it("não expõe rascunhos de eventos", async () => {
    const list = (await (await call("/api/events?past=1")).json()) as { status: string }[];
    expect(list.every((e) => e.status === "publicado")).toBe(true);
  });
});

describe("segurança de acesso (RNF02)", () => {
  it.each([
    ["POST", "/api/admin/attractions"],
    ["PUT", "/api/admin/events/1"],
    ["DELETE", "/api/admin/notices/1"],
    ["GET", "/api/admin/stats"],
    ["GET", "/api/admin/audit"],
  ])("%s %s sem login responde 401", async (method, path) => {
    expect((await call(path, { method, json: method === "GET" ? undefined : {} })).status).toBe(401);
  });

  it("rejeita senha errada e não vaza qual campo falhou", async () => {
    const res = await call("/api/auth/login", { method: "POST", headers: { "CF-Connecting-IP": "203.0.113.10" }, json: { email: ADMIN.email, password: "errada" } });
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe("E-mail ou senha incorretos");
  });

  it("cookie de sessão é HttpOnly e SameSite=Strict", async () => {
    const res = await call("/api/auth/login", { method: "POST", json: ADMIN });
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it("bloqueia após 5 tentativas erradas (rate limit)", async () => {
    const attempt = () => call("/api/auth/login", { method: "POST", headers: { "CF-Connecting-IP": "203.0.113.9" }, json: { email: "alvo@x.com", password: "x" } });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});

describe("CRUD do administrador", () => {
  it("rejeita dados inválidos com mensagem clara (400)", async () => {
    const cookie = await login();
    const res = await call("/api/admin/attractions", { method: "POST", cookie, json: { ...newAttraction, summary: "curto" } });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/Resumo/);
  });

  it("cria, altera o status e desativa uma atração, mantendo histórico e auditoria", async () => {
    const cookie = await login();

    const created = await call("/api/admin/attractions", { method: "POST", cookie, json: newAttraction });
    expect(created.status).toBe(201);
    const { id, slug } = (await created.json()) as { id: number; slug: string };

    expect((await call(`/api/attractions/${slug}`)).status).toBe(200);

    expect((await call(`/api/admin/attractions/${id}/status`, { method: "PATCH", cookie, json: { status: "manutencao" } })).status).toBe(200);
    expect(((await (await call(`/api/attractions/${slug}`)).json()) as { status: string }).status).toBe("manutencao");

    expect((await call(`/api/admin/attractions/${id}`, { method: "DELETE", cookie })).status).toBe(200);
    expect((await call(`/api/attractions/${slug}`)).status).toBe(404);
    const row = await env.DB.prepare("SELECT deleted_at FROM attractions WHERE id = ?").bind(id).first<{ deleted_at: string | null }>();
    expect(row?.deleted_at).not.toBeNull();

    expect((await call(`/api/admin/attractions/${id}`, { method: "DELETE", cookie })).status).toBe(404);

    const audit = (await (await call("/api/admin/audit", { cookie })).json()) as { action: string; entity_id: number }[];
    const actions = audit.filter((a) => a.entity_id === id).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["criar", "status", "desativar"]));
  });

  it("gera slug único para nomes repetidos", async () => {
    const cookie = await login();
    const a = (await (await call("/api/admin/attractions", { method: "POST", cookie, json: { ...newAttraction, name: "Duplicada" } })).json()) as { slug: string };
    const b = (await (await call("/api/admin/attractions", { method: "POST", cookie, json: { ...newAttraction, name: "Duplicada" } })).json()) as { slug: string };
    expect(a.slug).not.toBe(b.slug);
  });

  it("aviso desativado deixa de aparecer no topo do site", async () => {
    const cookie = await login();
    const created = await call("/api/admin/notices", { method: "POST", cookie, json: { title: "Trilha interditada", message: "Risco de deslizamento.", severity: "urgente", active: true } });
    const { id } = (await created.json()) as { id: number };
    const before = (await (await call("/api/notices")).json()) as { id: number }[];
    expect(before.some((x) => x.id === id)).toBe(true);
    await call(`/api/admin/notices/${id}`, { method: "DELETE", cookie });
    const after = (await (await call("/api/notices")).json()) as { id: number }[];
    expect(after.some((x) => x.id === id)).toBe(false);
  });
});

describe("temporadas e disponibilidade", () => {
  it("temporada fechada vigente bloqueia a atração automaticamente", async () => {
    const cookie = await login();
    const ts = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const start = iso(new Date(ts.getTime() - 864e5));
    const end = iso(new Date(ts.getTime() + 864e5));
    const att = (await (await call("/api/admin/attractions", { method: "POST", cookie, json: { ...newAttraction, name: "Atração sazonal" } })).json()) as { id: number; slug: string };

    const season = await call("/api/admin/seasons", { method: "POST", cookie, json: { name: "Fechamento", kind: "fechada", start_date: start, end_date: end, attraction_id: att.id } });
    expect(season.status).toBe(201);
    const { id: seasonId } = (await season.json()) as { id: number };

    expect(((await (await call(`/api/attractions/${att.slug}`)).json()) as { status: string }).status).toBe("fechada");

    await call(`/api/admin/seasons/${seasonId}`, { method: "DELETE", cookie });
    expect(((await (await call(`/api/attractions/${att.slug}`)).json()) as { status: string }).status).toBe("aberta");
  });

  it("rejeita temporada com fim antes do início", async () => {
    const cookie = await login();
    const res = await call("/api/admin/seasons", { method: "POST", cookie, json: { name: "Inválida", kind: "alta", start_date: "2026-12-20", end_date: "2026-12-01" } });
    expect(res.status).toBe(400);
  });
});

describe("conta do administrador", () => {
  async function createUser(email: string, password: string) {
    await env.DB.prepare("INSERT INTO users (email, name, password_hash) VALUES (?,?,?)").bind(email, "Usuário Conta", await hashPassword(password)).run();
    const res = await call("/api/auth/login", { method: "POST", headers: { "CF-Connecting-IP": `198.51.100.${++n % 250}` }, json: { email, password } });
    expect(res.status).toBe(200);
    return res.headers.get("set-cookie")!.split(";")[0];
  }

  it("exige login para ver ou alterar a conta", async () => {
    expect((await call("/api/admin/profile")).status).toBe(401);
    expect((await call("/api/admin/profile", { method: "PUT", json: {} })).status).toBe(401);
    expect((await call("/api/admin/password", { method: "PUT", json: {} })).status).toBe(401);
  });

  it("altera nome e e-mail, renova a sessão e registra na auditoria", async () => {
    const cookie = await createUser("conta1@tereverde.local", "SenhaAtual123");
    const res = await call("/api/admin/profile", { method: "PUT", cookie, json: { name: "Marcelo Souza Affonso", email: "  Marcelo.Novo@TereVerde.local " } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: "Marcelo Souza Affonso", email: "marcelo.novo@tereverde.local" });

    const newCookie = res.headers.get("set-cookie")!.split(";")[0];
    const me = (await (await call("/api/auth/me", { cookie: newCookie })).json()) as { email: string; name: string };
    expect(me).toMatchObject({ email: "marcelo.novo@tereverde.local", name: "Marcelo Souza Affonso" });

    const login = await call("/api/auth/login", { method: "POST", headers: { "CF-Connecting-IP": "198.51.100.77" }, json: { email: "marcelo.novo@tereverde.local", password: "SenhaAtual123" } });
    expect(login.status).toBe(200);

    const audit = (await (await call("/api/admin/audit", { cookie: newCookie })).json()) as { entity: string; user_email: string }[];
    expect(audit.some((a) => a.entity === "perfil" && a.user_email === "conta1@tereverde.local")).toBe(true);
  });

  it("rejeita e-mail com caracteres inválidos", async () => {
    const cookie = await createUser("conta2@tereverde.local", "SenhaAtual123");
    for (const email of ["joão@x.com", "ana silva@x.com", "<script>@x.com", "ana@x.com;--"]) {
      const res = await call("/api/admin/profile", { method: "PUT", cookie, json: { name: "Fulano", email } });
      expect(res.status, email).toBe(400);
      expect(((await res.json()) as { error: string }).error).toMatch(/E-mail/);
    }
  });

  it("não permite usar o e-mail de outro administrador (409)", async () => {
    const cookie = await createUser("conta3@tereverde.local", "SenhaAtual123");
    const res = await call("/api/admin/profile", { method: "PUT", cookie, json: { name: "Fulano", email: ADMIN.email } });
    expect(res.status).toBe(409);
  });

  it("troca a senha exigindo a atual e passa a valer só a nova", async () => {
    const cookie = await createUser("conta4@tereverde.local", "SenhaAtual123");

    const wrong = await call("/api/admin/password", { method: "PUT", cookie, json: { current_password: "errada123", new_password: "NovaSenha456" } });
    expect(wrong.status).toBe(400);
    expect(((await wrong.json()) as { error: string }).error).toMatch(/atual está incorreta/);

    const weak = await call("/api/admin/password", { method: "PUT", cookie, json: { current_password: "SenhaAtual123", new_password: "curta" } });
    expect(weak.status).toBe(400);

    const ok = await call("/api/admin/password", { method: "PUT", cookie, json: { current_password: "SenhaAtual123", new_password: "NovaSenha456" } });
    expect(ok.status).toBe(200);

    const attempt = (password: string) =>
      call("/api/auth/login", { method: "POST", headers: { "CF-Connecting-IP": "198.51.100.88" }, json: { email: "conta4@tereverde.local", password } });
    expect((await attempt("SenhaAtual123")).status).toBe(401);
    expect((await attempt("NovaSenha456")).status).toBe(200);

    const row = await env.DB.prepare("SELECT password_hash FROM users WHERE email = ?").bind("conta4@tereverde.local").first<{ password_hash: string }>();
    expect(row?.password_hash).not.toContain("NovaSenha456");
  });

  it("bloqueia após 5 tentativas erradas de senha atual", async () => {
    const cookie = await createUser("conta5@tereverde.local", "SenhaAtual123");
    const attempt = () => call("/api/admin/password", { method: "PUT", cookie, json: { current_password: "errada123", new_password: "NovaSenha456" } });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(400);
    expect((await attempt()).status).toBe(429);
  });
});

describe("imagens (RNF09)", () => {
  it("rejeita arquivos que não são imagem", async () => {
    const cookie = await login();
    const form = new FormData();
    form.append("file", new File(["conteudo"], "script.js", { type: "text/javascript" }));
    expect((await call("/api/admin/upload", { method: "POST", cookie, body: form })).status).toBe(415);
  });

  it("aceita imagem válida e a serve publicamente", async () => {
    const cookie = await login();
    const form = new FormData();
    form.append("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "foto.jpg", { type: "image/jpeg" }));
    const up = await call("/api/admin/upload", { method: "POST", cookie, body: form });
    expect(up.status).toBe(200);
    const { key } = (await up.json()) as { key: string };
    const media = await call(`/api/media/${key}`);
    expect(media.status).toBe(200);
    expect(media.headers.get("content-type")).toBe("image/jpeg");
  });
});
