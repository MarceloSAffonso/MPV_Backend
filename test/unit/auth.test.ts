import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/worker/auth";

describe("hash de senha (RNF01)", () => {
  it("nunca guarda a senha em texto puro", async () => {
    const hash = await hashPassword("minha-senha-forte");
    expect(hash).not.toContain("minha-senha-forte");
    expect(hash.startsWith("pbkdf2$100000$")).toBe(true);
  });

  it("gera hashes diferentes para a mesma senha (salt aleatório)", async () => {
    expect(await hashPassword("igual")).not.toBe(await hashPassword("igual"));
  });

  it("aceita a senha correta e rejeita a errada", async () => {
    const hash = await hashPassword("correta");
    expect(await verifyPassword("correta", hash)).toBe(true);
    expect(await verifyPassword("errada", hash)).toBe(false);
  });

  it("rejeita hashes malformados sem lançar erro", async () => {
    expect(await verifyPassword("x", "texto-puro")).toBe(false);
  });
});
