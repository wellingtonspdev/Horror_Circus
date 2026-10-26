import { compactVerify, importJWK, type JWK } from "jose";
import officialKey from "../../../astro-change-package/config/tse-public-key-2026.jwk.json" with { type: "json" };
export class SignatureError extends Error {}
export async function verifyJws(text: string, jwk: JWK = officialKey) {
  try {
    const key = await importJWK(jwk, "EdDSA");
    const { payload, protectedHeader } = await compactVerify(text.trim(), key, {
      algorithms: ["EdDSA"],
    });
    if (protectedHeader.kid !== jwk.kid)
      throw new Error("Unexpected TSE signing key id");
    return JSON.parse(new TextDecoder().decode(payload)) as unknown;
  } catch (cause) {
    throw new SignatureError(
      "Assinatura oficial inválida. O novo resultado não foi aceito.",
      { cause },
    );
  }
}
