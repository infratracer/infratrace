import type { SensorType } from "../types";

export const SENSOR_CONFIG: Record<
  SensorType,
  { label: string; unit: string; base: number; range: [number, number] }
> = {
  steel_price: { label: "Steel Price", unit: "$/tonne", base: 1000, range: [800, 1400] },
  copper_price: { label: "Copper Price", unit: "$/tonne", base: 9000, range: [7500, 11000] },
  labour_rate: { label: "Labour Rate", unit: "$/hour", base: 82, range: [70, 100] },
  rainfall: { label: "Rainfall", unit: "mm/day", base: 10, range: [0, 50] },
  temperature: { label: "Temperature", unit: "°C", base: 28, range: [15, 42] },
  delivery_status: { label: "Delivery Delay", unit: "days", base: 3, range: [0, 21] },
};

export const DECISION_TYPES = [
  { value: "scope_change", label: "Scope Change" },
  { value: "cost_revision", label: "Cost Revision" },
  { value: "assumption_change", label: "Assumption Change" },
  { value: "contractor_change", label: "Contractor Change" },
  { value: "schedule_change", label: "Schedule Change" },
  { value: "risk_acceptance", label: "Risk Acceptance" },
  { value: "approval", label: "Approval" },
];

export const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
