import { useEffect, useRef, useCallback, useState } from "react";
import { env } from "../config/env";
import type { SensorMessage } from "../types";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export function useSensorSocket(
  projectId: string | undefined,
  onMessage: (msg: SensorMessage) => void
): WsStatus {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!projectId) return;
    setStatus("connecting");
    const base = env.WS_URL || window.location.origin.replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/ws/sensors/${projectId}`);

    ws.onopen = () => setStatus("connected");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus("disconnected");
      reconnectTimer.current = setTimeout(() => connect(), 3000);
    };

    wsRef.current = ws;
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return status;
}
