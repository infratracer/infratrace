import client from "./client";

export async function exportReport(
  projectId: string,
  options?: {
    include_ai?: boolean;
    include_sensors?: boolean;
    include_blockchain?: boolean;
  }
): Promise<Blob> {
  const res = await client.post(
    `/projects/${projectId}/reports/export`,
    null,
    {
      params: options,
      responseType: "blob",
    }
  );
  return res.data;
}
