export const REGIONS = [
  {
    code: "norte",
    name: "Norte",
    states: [
      ["ac", "Acre"],
      ["ap", "Amapá"],
      ["am", "Amazonas"],
      ["pa", "Pará"],
      ["ro", "Rondônia"],
      ["rr", "Roraima"],
      ["to", "Tocantins"],
    ],
  },
  {
    code: "nordeste",
    name: "Nordeste",
    states: [
      ["al", "Alagoas"],
      ["ba", "Bahia"],
      ["ce", "Ceará"],
      ["ma", "Maranhão"],
      ["pb", "Paraíba"],
      ["pe", "Pernambuco"],
      ["pi", "Piauí"],
      ["rn", "Rio Grande do Norte"],
      ["se", "Sergipe"],
    ],
  },
  {
    code: "centro-oeste",
    name: "Centro-Oeste",
    states: [
      ["df", "Distrito Federal"],
      ["go", "Goiás"],
      ["mt", "Mato Grosso"],
      ["ms", "Mato Grosso do Sul"],
    ],
  },
  {
    code: "sudeste",
    name: "Sudeste",
    states: [
      ["es", "Espírito Santo"],
      ["mg", "Minas Gerais"],
      ["rj", "Rio de Janeiro"],
      ["sp", "São Paulo"],
    ],
  },
  {
    code: "sul",
    name: "Sul",
    states: [
      ["pr", "Paraná"],
      ["rs", "Rio Grande do Sul"],
      ["sc", "Santa Catarina"],
    ],
  },
  { code: "exterior", name: "Exterior", states: [["zz", "Exterior"]] },
] as const;
export type RegionCode = (typeof REGIONS)[number]["code"];
export type UfCode = (typeof REGIONS)[number]["states"][number][0];
export type TseScope = "br" | UfCode;
export function getRegion(code: string) {
  return REGIONS.find((region) => region.code === code);
}
export function isTseScope(code: string): code is TseScope {
  return (
    code === "br" ||
    REGIONS.some((region) => region.states.some(([uf]) => uf === code))
  );
}
