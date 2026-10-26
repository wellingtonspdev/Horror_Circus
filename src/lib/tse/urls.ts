export const BASE = "https://resultados.tse.jus.br";
export const CATALOG = `${BASE}/oficial/comum/config/ele-c.json`;
import { isTseScope, type TseScope } from "./geography.ts";
export const resultUrl = (format = "json", scope: TseScope = "br") => {
  if (!isTseScope(scope) || !["json", "jws"].includes(format))
    throw new Error("Invalid TSE scope or format");
  return `${BASE}/oficial/ele2026/6258/dados/${scope}/${scope}-c0001-e006258-u.${format}`;
};
export const photoUrl = (id: string) =>
  `${BASE}/oficial/ele2026/6258/fotos/br/${id}.jpeg`;
