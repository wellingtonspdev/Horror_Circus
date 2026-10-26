import { useQuery } from "@tanstack/react-query";
import { fetchResults, fixtureMode, pollingDelay } from "./tse/client.ts";
export function useElection() {
  return useQuery({
    queryKey: ["president-2026", fixtureMode],
    queryFn: fetchResults,
    retry: false,
    staleTime: 4500,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    refetchInterval: (q) => {
      if (fixtureMode) return false;
      const d = q.state.data;
      if (q.state.error || d?.stale) return pollingDelay();
      if (d?.result.status === "final") return false;
      return 5000;
    },
  });
}
