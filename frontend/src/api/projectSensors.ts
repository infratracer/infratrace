import client from "./client";

export interface SensorConfig {
  id: string;
  project_id: string;
  name: string;
  label: string;
  unit: string;
  category: string | null;
  data_source: string;
  source_config: Record<string, unknown> | null;
  poll_interval_seconds: number;
  threshold_min: number | null;
  threshold_max: number | null;
  warning_threshold: number | null;
  base_value: number | null;
  range_min: number | null;
  range_max: number | null;
  noise_factor: number | null;
  display_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export async function getSensorConfigs(projectId: string): Promise<SensorConfig[]> {
  const res = await client.get(`/projects/${projectId}/sensors/config`);
  return res.data;
}

export async function createSensorConfig(
  projectId: string,
  data: {
    name: string;
    label: string;
    unit: string;
    category?: string;
    data_source?: string;
    source_config?: Record<string, unknown>;
    threshold_min?: number;
    threshold_max?: number;
    warning_threshold?: number;
    base_value?: number;
    range_min?: number;
    range_max?: number;
    noise_factor?: number;
    display_order?: number;
  }
): Promise<SensorConfig> {
  const res = await client.post(`/projects/${projectId}/sensors/config`, data);
  return res.data;
}

export async function updateSensorConfig(
  projectId: string,
  sensorId: string,
  data: Partial<Omit<SensorConfig, "id" | "project_id" | "created_by" | "created_at">>
): Promise<SensorConfig> {
  const res = await client.put(`/projects/${projectId}/sensors/config/${sensorId}`, data);
  return res.data;
}

export async function deleteSensorConfig(projectId: string, sensorId: string): Promise<void> {
  await client.delete(`/projects/${projectId}/sensors/config/${sensorId}`);
}
