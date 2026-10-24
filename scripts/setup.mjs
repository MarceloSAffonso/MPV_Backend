import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const run = (cmd) => execSync(cmd, { stdio: "inherit", env: { ...process.env, CI: "1" } });

console.log("\n[1/4] Segredo local (.dev.vars)");
if (existsSync(".dev.vars")) {
  console.log("  já existe, mantido.");
} else {
  writeFileSync(".dev.vars", `JWT_SECRET=${randomBytes(32).toString("hex")}\n`);
  console.log("  criado com um JWT_SECRET aleatório.");
}

console.log("\n[2/4] Banco de dados local (D1): esquema e dados de exemplo");
run("npx wrangler d1 migrations apply tere-verde --local");

console.log("\n[3/4] Fotos das atrações (R2 local)");
for (const file of readdirSync("data/photos").filter((f) => f.endsWith(".jpg"))) {
  run(`npx wrangler r2 object put "tere-verde-media/img/${file}" --file "${join("data", "photos", file)}" --content-type image/jpeg --local`);
}

console.log("\n[4/4] Administrador de teste");
run('node scripts/make-admin.mjs --local --email admin@tereverde.local --password "TereVerde@2026" --name "Administrador"');

console.log("\nPronto. Rode: npm run dev   (http://localhost:5173)\n");
