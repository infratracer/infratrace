import { create } from "zustand";
import type { SensorMessage, SensorType } from "../types";

interface SensorState {
  latest: Partial<Record<SensorType, SensorMessage>>;
  anomalies: SensorMessage[];
  updateReading: (msg: SensorMessage) => void;
  clearAnomalies: () => void;
  clearAll: () => void;
}

export const useSensorStore = create<SensorState>((set) => ({
  latest: {},
  anomalies: [],
  updateReading: (msg) =>
    set((state) => ({
      latest: { ...state.latest, [msg.sensor_type]: msg },
      anomalies: msg.anomaly
        ? [...state.anomalies.slice(-49), msg]
        : state.anomalies,
    })),
  clearAnomalies: () => set({ anomalies: [] }),
  clearAll: () => set({ latest: {}, anomalies: [] }),
}));
