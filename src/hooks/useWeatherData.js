import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeeds } from "../api/thingspeak";
import { REFRESH_MS } from "../config";

export function useWeatherData(results, autoRefresh) {
  const [state, setState] = useState({
    feeds: [], channel: null, loading: true, error: null, fetchedAt: null,
  });
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState((s) => ({ ...s, loading: true }));
    try {
      const { channel, feeds } = await fetchFeeds(results, ctrl.signal);
      setState({ feeds, channel, loading: false, error: null, fetchedAt: Date.now() });
    } catch (e) {
      if (e.name === "AbortError") return;
      setState((s) => ({ ...s, loading: false, error: e.message || "Could not load data" }));
    }
  }, [results]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  return { ...state, reload: load };
}
