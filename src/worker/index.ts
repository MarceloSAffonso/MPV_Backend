import { Hono } from "hono";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { hashPassword, verifyPassword } from "./auth";
import { attractionSchema, eventSchema, loginSchema, noticeSchema, passwordSchema, profileSchema, seasonSchema, statusSchema } from "./schemas";
import { SEASON_CLOSED_SQL, addDays, effectiveStatus, slugify, today } from "./util";

type Bindings = { DB: D1Database; MEDIA: R2Bucket; KV: KVNamespace; JWT_SECRET: string };
type Variables = { user: { id: number; email: string; name: string } };
type Env = { Bindings: Bindings; Variables: Variables };
type AppContext = Context<Env>;

const validate = <T extends ZodType>(schema: T) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const issues = (result.error as { issues?: { message: string }[] }).issues ?? [];
      return c.json({ error: issues.map((i) => i.message).join("; ") || "Dados inválidos" }, 400);
    }
  });

const app = new Hono<Env>();
const COOKIE = "tv_session";
const SESSION_SECONDS = 60 * 60 * 8;
const MAX_UPLOAD = 3 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

app.use("/api/*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");
  c.header("X-Frame-Options", "DENY");
});

const edgeCache: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== "GET" || !/^\/api\/(attractions|events|notices|seasons)(\/|$)/.test(c.req.path)) return next();
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(c.req.url, { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;
  await next();
  if (c.res.status === 200) {
    c.res.headers.set("Cache-Control", "public, max-age=15, s-maxage=30");
    c.executionCtx.waitUntil(cache.put(key, c.res.clone()));
  }
};

const requireAuth: MiddlewareHandler<Env> = async (c, next) => {
  const token = getCookie(c, COOKIE);
  if (!token) return c.json({ error: "Não autenticado" }, 401);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    c.set("user", { id: Number(payload.sub), email: String(payload.email), name: String(payload.name) });
  } catch {
    return c.json({ error: "Sessão expirada" }, 401);
  }
  c.header("Cache-Control", "no-store");
  await next();
};

async function startSession(c: Context<Env, any, any>, user: { id: number; email: string; name: string }) {
  const token = await sign(
    { sub: String(user.id), email: user.email, name: user.name, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS },
    c.env.JWT_SECRET,
    "HS256",
  );
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

async function audit(c: AppContext, action: string, entity: string, entityId: number | string | null, detail?: string) {
  await c.env.DB.prepare("INSERT INTO audit_log (user_email, action, entity, entity_id, detail) VALUES (?,?,?,?,?)")
    .bind(c.get("user").email, action, entity, entityId == null ? null : Number(entityId), detail ?? null)
    .run();
}

const pub = new Hono<{ Bindings: Bindings }>();
pub.use("*", edgeCache);

pub.get("/attractions", async (c) => {
  const { category, status, q } = c.req.query();
  const where: string[] = ["a.deleted_at IS NULL"];
  const args: unknown[] = [];
  if (category) (where.push("a.category = ?"), args.push(category));
  if (q) (where.push("(a.name LIKE ? OR a.summary LIKE ? OR a.location LIKE ?)"), args.push(`%${q}%`, `%${q}%`, `%${q}%`));
  const sql = `SELECT a.*, ${SEASON_CLOSED_SQL} AS season_closed FROM attractions a WHERE ${where.join(" AND ")} ORDER BY a.featured DESC, a.name`;
  const { results } = await c.env.DB.prepare(sql).bind(...args).all<{ status: string; season_closed: number }>();
  const rows = results.map(effectiveStatus);
  return c.json(status ? rows.filter((r) => r.status === status) : rows);
});

pub.get("/attractions/:slug", async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT a.*, ${SEASON_CLOSED_SQL} AS season_closed FROM attractions a WHERE a.slug = ? AND a.deleted_at IS NULL`,
  )
    .bind(c.req.param("slug"))
    .first<{ id: number; status: string; season_closed: number }>();
  if (!row) return c.json({ error: "Atração não encontrada" }, 404);
  const events = await c.env.DB.prepare(
    "SELECT * FROM events WHERE attraction_id = ? AND status = 'publicado' AND deleted_at IS NULL AND date >= ? ORDER BY date, time LIMIT 6",
  )
    .bind(row.id, today())
    .all();
  const seasons = await c.env.DB.prepare(
    `SELECT * FROM seasons WHERE deleted_at IS NULL AND (attraction_id = ? OR attraction_id IS NULL) AND end_date >= ? ORDER BY start_date`,
  )
    .bind(row.id, today())
    .all();
  return c.json({ ...effectiveStatus(row), events: events.results, seasons: seasons.results });
});

pub.get("/seasons", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS attraction_name, a.slug AS attraction_slug FROM seasons s LEFT JOIN attractions a ON a.id = s.attraction_id
     WHERE s.deleted_at IS NULL AND s.end_date >= ? ORDER BY s.start_date`,
  )
    .bind(today())
    .all();
  return c.json(results);
});

pub.get("/events", async (c) => {
  const { category, from, to, q, past } = c.req.query();
  const where = ["e.status = 'publicado'", "e.deleted_at IS NULL"];
  const args: unknown[] = [];
  if (past !== "1") (where.push("e.date >= ?"), args.push(from || today()));
  else if (from) (where.push("e.date >= ?"), args.push(from));
  if (to) (where.push("e.date <= ?"), args.push(to));
  if (category) (where.push("e.category = ?"), args.push(category));
  if (q) (where.push("(e.title LIKE ? OR e.description LIKE ?)"), args.push(`%${q}%`, `%${q}%`));
  const sql = `SELECT e.*, a.name AS attraction_name, a.slug AS attraction_slug FROM events e
    LEFT JOIN attractions a ON a.id = e.attraction_id AND a.deleted_at IS NULL WHERE ${where.join(" AND ")} ORDER BY e.date, e.time`;
  const { results } = await c.env.DB.prepare(sql).bind(...args).all();
  return c.json(results);
});

pub.get("/notices", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT n.*, a.slug AS attraction_slug FROM notices n LEFT JOIN attractions a ON a.id = n.attraction_id AND a.deleted_at IS NULL
     WHERE n.active = 1 AND n.deleted_at IS NULL ORDER BY CASE n.severity WHEN 'urgente' THEN 0 WHEN 'alerta' THEN 1 ELSE 2 END, n.created_at DESC`,
  ).all();
  return c.json(results);
});

pub.get("/media/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/media\//, "");
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
});

app.route("/api", pub);

app.post("/api/auth/login", validate(loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const ip = c.req.header("CF-Connecting-IP") ?? "local";
  const rlKey = `login:${ip}`;
  const attempts = Number((await c.env.KV.get(rlKey)) ?? 0);
  if (attempts >= 5) return c.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);

  const user = await c.env.DB.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number; email: string; name: string; password_hash: string }>();
  const ok = await verifyPassword(password, user?.password_hash ?? "pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!user || !ok) {
    await c.env.KV.put(rlKey, String(attempts + 1), { expirationTtl: 600 });
    return c.json({ error: "E-mail ou senha incorretos" }, 401);
  }
  await c.env.KV.delete(rlKey);
  await startSession(c, user);
  return c.json({ id: user.id, email: user.email, name: user.name });
});

app.post("/api/auth/logout", (c) => {
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (c) => c.json(c.get("user")));

const admin = new Hono<Env>();
admin.use("*", requireAuth);

admin.get("/profile", async (c) => {
  const row = await c.env.DB.prepare("SELECT id, email, name FROM users WHERE id = ?").bind(c.get("user").id).first();
  return row ? c.json(row) : c.json({ error: "Usuário não encontrado" }, 404);
});

admin.put("/profile", validate(profileSchema), async (c) => {
  const { name, email } = c.req.valid("json");
  const me = c.get("user");
  try {
    await c.env.DB.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").bind(name, email, me.id).run();
  } catch (err) {
    if (String(err).includes("UNIQUE")) return c.json({ error: "Este e-mail já está em uso por outro administrador" }, 409);
    throw err;
  }
  await startSession(c, { id: me.id, email, name });
  await audit(c, "atualizar", "perfil", me.id, email === me.email ? "nome" : "nome e e-mail");
  return c.json({ id: me.id, email, name });
});

admin.put("/password", validate(passwordSchema), async (c) => {
  const { current_password, new_password } = c.req.valid("json");
  const me = c.get("user");
  const rlKey = `pw:${me.id}`;
  const attempts = Number((await c.env.KV.get(rlKey)) ?? 0);
  if (attempts >= 5) return c.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);

  const row = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(me.id).first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(current_password, row.password_hash))) {
    await c.env.KV.put(rlKey, String(attempts + 1), { expirationTtl: 600 });
    return c.json({ error: "A senha atual está incorreta" }, 400);
  }
  await c.env.KV.delete(rlKey);
  await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(new_password), me.id).run();
  await audit(c, "atualizar", "perfil", me.id, "senha");
  return c.json({ ok: true });
});

admin.get("/stats", async (c) => {
  const db = c.env.DB;
  const one = async (sql: string, ...args: unknown[]) =>
    Number((await db.prepare(sql).bind(...args).first<{ n: number }>())?.n ?? 0);
  return c.json({
    attractions: await one("SELECT COUNT(*) n FROM attractions WHERE deleted_at IS NULL"),
    open: await one("SELECT COUNT(*) n FROM attractions WHERE deleted_at IS NULL AND status = 'aberta'"),
    restricted: await one("SELECT COUNT(*) n FROM attractions WHERE deleted_at IS NULL AND status != 'aberta'"),
    events: await one("SELECT COUNT(*) n FROM events WHERE deleted_at IS NULL AND status = 'publicado'"),
    upcoming: await one("SELECT COUNT(*) n FROM events WHERE deleted_at IS NULL AND status = 'publicado' AND date BETWEEN ? AND ?", today(), addDays(30)),
    notices: await one("SELECT COUNT(*) n FROM notices WHERE deleted_at IS NULL AND active = 1"),
    seasons: await one("SELECT COUNT(*) n FROM seasons WHERE deleted_at IS NULL AND end_date >= ?", today()),
  });
});

const notFound = (c: AppContext) => c.json({ error: "Registro não encontrado" }, 404);

admin.get("/attractions", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM attractions WHERE deleted_at IS NULL ORDER BY featured DESC, name").all();
  return c.json(results);
});

admin.post("/attractions", validate(attractionSchema), async (c) => {
  const d = c.req.valid("json");
  const base = slugify(d.name) || "atracao";
  let slug = base;
  for (let i = 2; await c.env.DB.prepare("SELECT 1 FROM attractions WHERE slug = ?").bind(slug).first(); i++) slug = `${base}-${i}`;
  const r = await c.env.DB.prepare(
    `INSERT INTO attractions (slug,name,category,summary,description,location,difficulty,distance_km,duration,altitude_m,status,safety_notes,image_key,image_credit,featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(slug, d.name, d.category, d.summary, d.description, d.location, d.difficulty, d.distance_km, d.duration, d.altitude_m, d.status, d.safety_notes, d.image_key, d.image_credit, d.featured ? 1 : 0)
    .run();
  await audit(c, "criar", "atracao", r.meta.last_row_id, d.name);
  return c.json({ id: r.meta.last_row_id, slug }, 201);
});

admin.put("/attractions/:id", validate(attractionSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare(
    `UPDATE attractions SET name=?,category=?,summary=?,description=?,location=?,difficulty=?,distance_km=?,duration=?,altitude_m=?,status=?,safety_notes=?,image_key=?,image_credit=?,featured=?,updated_at=datetime('now') WHERE id=? AND deleted_at IS NULL`,
  )
    .bind(d.name, d.category, d.summary, d.description, d.location, d.difficulty, d.distance_km, d.duration, d.altitude_m, d.status, d.safety_notes, d.image_key, d.image_credit, d.featured ? 1 : 0, c.req.param("id"))
    .run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "atualizar", "atracao", c.req.param("id"), d.name);
  return c.json({ ok: true });
});

admin.patch("/attractions/:id/status", validate(statusSchema), async (c) => {
  const { status } = c.req.valid("json");
  const r = await c.env.DB.prepare("UPDATE attractions SET status=?, updated_at=datetime('now') WHERE id=? AND deleted_at IS NULL")
    .bind(status, c.req.param("id"))
    .run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "status", "atracao", c.req.param("id"), status);
  return c.json({ ok: true });
});

admin.delete("/attractions/:id", async (c) => {
  const r = await c.env.DB.prepare("UPDATE attractions SET deleted_at = datetime('now') WHERE id=? AND deleted_at IS NULL").bind(c.req.param("id")).run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "desativar", "atracao", c.req.param("id"));
  return c.json({ ok: true });
});

admin.get("/events", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT e.*, a.name AS attraction_name FROM events e LEFT JOIN attractions a ON a.id = e.attraction_id WHERE e.deleted_at IS NULL ORDER BY e.date DESC, e.time",
  ).all();
  return c.json(results);
});

admin.post("/events", validate(eventSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare(
    "INSERT INTO events (title,description,location,date,time,category,status,image_key,attraction_id) VALUES (?,?,?,?,?,?,?,?,?)",
  )
    .bind(d.title, d.description, d.location, d.date, d.time, d.category, d.status, d.image_key, d.attraction_id)
    .run();
  await audit(c, "criar", "evento", r.meta.last_row_id, d.title);
  return c.json({ id: r.meta.last_row_id }, 201);
});

admin.put("/events/:id", validate(eventSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare(
    "UPDATE events SET title=?,description=?,location=?,date=?,time=?,category=?,status=?,image_key=?,attraction_id=?,updated_at=datetime('now') WHERE id=? AND deleted_at IS NULL",
  )
    .bind(d.title, d.description, d.location, d.date, d.time, d.category, d.status, d.image_key, d.attraction_id, c.req.param("id"))
    .run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "atualizar", "evento", c.req.param("id"), d.title);
  return c.json({ ok: true });
});

admin.delete("/events/:id", async (c) => {
  const r = await c.env.DB.prepare("UPDATE events SET deleted_at = datetime('now') WHERE id=? AND deleted_at IS NULL").bind(c.req.param("id")).run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "desativar", "evento", c.req.param("id"));
  return c.json({ ok: true });
});

admin.get("/notices", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT n.*, a.name AS attraction_name FROM notices n LEFT JOIN attractions a ON a.id = n.attraction_id WHERE n.deleted_at IS NULL ORDER BY n.active DESC, n.created_at DESC",
  ).all();
  return c.json(results);
});

admin.post("/notices", validate(noticeSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare("INSERT INTO notices (title,message,severity,attraction_id,active) VALUES (?,?,?,?,?)")
    .bind(d.title, d.message, d.severity, d.attraction_id, d.active ? 1 : 0)
    .run();
  await audit(c, "criar", "aviso", r.meta.last_row_id, d.title);
  return c.json({ id: r.meta.last_row_id }, 201);
});

admin.put("/notices/:id", validate(noticeSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare("UPDATE notices SET title=?,message=?,severity=?,attraction_id=?,active=? WHERE id=? AND deleted_at IS NULL")
    .bind(d.title, d.message, d.severity, d.attraction_id, d.active ? 1 : 0, c.req.param("id"))
    .run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "atualizar", "aviso", c.req.param("id"), d.title);
  return c.json({ ok: true });
});

admin.delete("/notices/:id", async (c) => {
  const r = await c.env.DB.prepare("UPDATE notices SET deleted_at = datetime('now'), active = 0 WHERE id=? AND deleted_at IS NULL").bind(c.req.param("id")).run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "desativar", "aviso", c.req.param("id"));
  return c.json({ ok: true });
});

admin.get("/seasons", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT s.*, a.name AS attraction_name FROM seasons s LEFT JOIN attractions a ON a.id = s.attraction_id WHERE s.deleted_at IS NULL ORDER BY s.start_date DESC",
  ).all();
  return c.json(results);
});

admin.post("/seasons", validate(seasonSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare("INSERT INTO seasons (name,kind,start_date,end_date,attraction_id,notes) VALUES (?,?,?,?,?,?)")
    .bind(d.name, d.kind, d.start_date, d.end_date, d.attraction_id, d.notes)
    .run();
  await audit(c, "criar", "temporada", r.meta.last_row_id, d.name);
  return c.json({ id: r.meta.last_row_id }, 201);
});

admin.put("/seasons/:id", validate(seasonSchema), async (c) => {
  const d = c.req.valid("json");
  const r = await c.env.DB.prepare("UPDATE seasons SET name=?,kind=?,start_date=?,end_date=?,attraction_id=?,notes=? WHERE id=? AND deleted_at IS NULL")
    .bind(d.name, d.kind, d.start_date, d.end_date, d.attraction_id, d.notes, c.req.param("id"))
    .run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "atualizar", "temporada", c.req.param("id"), d.name);
  return c.json({ ok: true });
});

admin.delete("/seasons/:id", async (c) => {
  const r = await c.env.DB.prepare("UPDATE seasons SET deleted_at = datetime('now') WHERE id=? AND deleted_at IS NULL").bind(c.req.param("id")).run();
  if (!r.meta.changes) return notFound(c);
  await audit(c, "desativar", "temporada", c.req.param("id"));
  return c.json({ ok: true });
});

admin.get("/audit", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 100").all();
  return c.json(results);
});

admin.post("/upload", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "Envie um arquivo" }, 400);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return c.json({ error: "Use imagens JPG, PNG ou WebP" }, 415);
  if (file.size > MAX_UPLOAD) return c.json({ error: "A imagem deve ter no máximo 3 MB" }, 413);
  const key = `img/${crypto.randomUUID()}.${ext}`;
  await c.env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await audit(c, "criar", "imagem", null, key);
  return c.json({ key });
});

app.route("/api/admin", admin);

app.notFound((c) => c.json({ error: "Rota não encontrada" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Erro interno do servidor" }, 500);
});

export default app;
