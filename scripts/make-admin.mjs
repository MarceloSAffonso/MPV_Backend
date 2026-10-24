import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { webcrypto as crypto } from "node:crypto";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const target = args.includes("--remote") ? "--remote" : "--local";
const email = (flag("email") ?? "").trim().toLowerCase();
const password = flag("password") ?? "";
const name = flag("name") ?? "Administrador";

if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email) || password.length < 8) {
  console.error("Informe --email válido (letras sem acento, números e . _ % + -) e --password com ao menos 8 caracteres.");
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
const b64 = (b) => Buffer.from(b).toString("base64");
const hash = `pbkdf2$100000$${b64(salt)}$${b64(bits)}`;
const q = (s) => `'${s.replaceAll("'", "''")}'`;

const sql = `INSERT INTO users (email, name, password_hash) VALUES (${q(email)}, ${q(name)}, ${q(hash)})
ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash;`;
const dir = mkdtempSync(join(tmpdir(), "tv-admin-"));
const file = join(dir, "admin.sql");
writeFileSync(file, sql);

execFileSync("npx", ["wrangler", "d1", "execute", "tere-verde", target, "--file", file], { stdio: "inherit", shell: true });
console.log(`Administrador ${email} salvo (${target.slice(2)}).`);
