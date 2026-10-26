import { useQuery } from "@tanstack/react-query";
import { regionResponseSchema } from "./tse/regions";
import type { RegionCode } from "./tse/geography";
import { fixtureMode } from "./tse/client";
const failures = new Map<RegionCode, number>();
async function fetchRegion(region: RegionCode, signal: AbortSignal) {
  try {
    const response = await fetch(
      `/api/regions?region=${encodeURIComponent(region)}`,
      { signal: AbortSignal.any([signal, AbortSignal.timeout(65000)]) },
    );
    if (!response.ok)
      throw new Error("Não foi possível obter as fontes regionais.");
    const data = regionResponseSchema.parse(await response.json());
    if (data.region !== region)
      throw new Error("A resposta não corresponde à região selecionada.");
    failures.set(region, data.stale ? (failures.get(region) || 0) + 1 : 0);
    return data;
  } catch (error) {
    if (!signal.aborted) failures.set(region, (failures.get(region) || 0) + 1);
    throw error;
  }
}
export function useRegion(region: RegionCode | null) {
  return useQuery({
    queryKey: ["regions-2026", region],
    enabled: !!region && !fixtureMode,
    queryFn: ({ signal }) => fetchRegion(region!, signal),
    retry: false,
    staleTime: 14000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    refetchInterval: (q) => {
      if (!region || fixtureMode) return false;
      if (q.state.error || q.state.data?.stale)
        return Math.min(
          15000 * 2 ** Math.max((failures.get(region) || 1) - 1, 0),
          60000,
        );
      if (q.state.data?.summary?.status === "final") return false;
      return 15000;
    },
  });
}
