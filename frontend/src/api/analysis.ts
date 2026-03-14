import client from "./client";
import type { AIAnalysisResult } from "../types";

export async function getAnalyses(projectId: string): Promise<AIAnalysisResult[]> {
  const res = await client.get(`/projects/${projectId}/analysis`);
  return res.data;
}

export async function runAnalysis(projectId: string): Promise<{ message: string }> {
  const res = await client.post(`/projects/${projectId}/analysis`);
  return res.data;
}
