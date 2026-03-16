import client from "./client";

export interface SettingOption {
  value: string;
  label: string;
}

export interface ProjectSettingResponse {
  setting_key: string;
  setting_value: SettingOption[];
}

export async function getProjectSetting(
  projectId: string,
  key: string
): Promise<ProjectSettingResponse> {
  const res = await client.get(`/projects/${projectId}/settings/${key}`);
  return res.data;
}

export async function updateProjectSetting(
  projectId: string,
  key: string,
  value: SettingOption[]
): Promise<ProjectSettingResponse> {
  const res = await client.put(`/projects/${projectId}/settings/${key}`, {
    setting_value: value,
  });
  return res.data;
}
