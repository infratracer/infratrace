import client from "./client";
import type { SensorReading } from "../types";

export async function getSensorReadings(
  projectId: string,
  params?: { sensor_type?: string; limit?: number }
): Promise<SensorReading[]> {
  const res = await client.get(`/projects/${projectId}/sensors`, { params });
  return res.data;
}

export async function getLatestReadings(
  projectId: string
): Promise<SensorReading[]> {
  const res = await client.get(`/projects/${projectId}/sensors/latest`);
  return res.data;
}
