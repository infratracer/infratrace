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
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnect on intentional close
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!projectId) return;
    cleanup();
    setStatus("connecting");
    const base = env.WS_URL || window.location.origin.replace(/^http/, "ws");
    const ws = new WebSocket(`${base}/ws/sensors/${projectId}`);

    ws.onopen = () => {
      setStatus("connected");
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (e) {
        console.warn("WebSocket parse error:", e);
      }
    };

    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus("disconnected");
      // Exponential backoff: 3s, 6s, 12s, max 30s
      const delay = Math.min(3000 * Math.pow(2, retryCount.current), 30000);
      retryCount.current++;
      reconnectTimer.current = setTimeout(() => connect(), delay);
    };

    wsRef.current = ws;
  }, [projectId, cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return status;
}
