export const BASE = "https://resultados.tse.jus.br";
export const CATALOG = `${BASE}/oficial/comum/config/ele-c.json`;
export const resultUrl = (format = "json") =>
  `${BASE}/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.${format}`;
export const photoUrl = (id: string) =>
  `${BASE}/oficial/ele2026/6258/fotos/br/${id}.jpeg`;

