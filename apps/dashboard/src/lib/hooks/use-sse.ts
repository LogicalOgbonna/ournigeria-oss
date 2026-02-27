"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useSSE<T>(url: string, enabled = true) {
  const [events, setEvents] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        setEvents((prev) => [...prev, data]);
      } catch {
        // ignore non-JSON messages
      }
    };

    es.onerror = () => {
      setConnected(false);
      setError("Connection lost. Reconnecting...");
      es.close();
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, [url, enabled]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  return { events, connected, error };
}
