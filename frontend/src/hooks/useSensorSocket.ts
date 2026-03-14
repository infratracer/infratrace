import { useEffect, useRef, useCallback } from "react";
import { env } from "../config/env";
import type { SensorMessage } from "../types";

export function useSensorSocket(
  projectId: string | undefined,
  onMessage: (msg: SensorMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!projectId) return;
    const base = env.WS_URL || window.location.origin.replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/ws/sensors/${projectId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setTimeout(() => connect(), 3000);
    };

    wsRef.current = ws;
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
