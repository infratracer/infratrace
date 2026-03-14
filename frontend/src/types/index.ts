export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "project_manager" | "auditor" | "stakeholder";
  organisation: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "on_hold" | "completed";
  risk_level: "low" | "medium" | "high" | "critical";
  budget: number;
  spent: number;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  added_at: string;
}

export type DecisionType =
  | "scope_change"
  | "cost_revision"
  | "assumption_change"
  | "contractor_change"
  | "schedule_change"
  | "risk_acceptance"
  | "approval";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Decision {
  id: string;
  project_id: string;
  sequence_number: number;
  decision_type: DecisionType;
  title: string;
  description: string;
  justification: string;
  cost_impact: number;
  risk_level: RiskLevel;
  approved_by: string;
  hash: string;
  previous_hash: string;
  blockchain_tx: string | null;
  blockchain_status: string;
  sensor_trigger_id: string | null;
  created_by: string;
  created_at: string;
}

export interface Assumption {
  id: string;
  project_id: string;
  category: string;
  description: string;
  sensor_type: SensorType | null;
  threshold_value: number | null;
  threshold_unit: string | null;
  status: "active" | "validated" | "invalidated";
  linked_decision_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SensorType =
  | "steel_price"
  | "copper_price"
  | "labour_rate"
  | "rainfall"
  | "temperature"
  | "delivery_status";

export interface SensorReading {
  id: string;
  project_id: string;
  sensor_type: SensorType;
  value: number;
  unit: string;
  anomaly_flag: boolean;
  recorded_at: string;
}

export interface SensorMessage {
  sensor_type: SensorType;
  value: number;
  unit: string;
  anomaly: boolean;
  assumption_text?: string;
  threshold?: number;
  deviation_pct?: number;
  timestamp: string;
}

export interface AIAnalysisResult {
  id: string;
  project_id: string;
  analysis_type: string;
  risk_score: number;
  summary: string;
  findings: AIFinding[];
  related_decisions: string[];
  related_sensors: string[];
  model_version: string;
  created_at: string;
}

export interface AIFinding {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  recommendation: string;
  related_decision_ids: string[];
}

export interface BlockchainAnchor {
  id: string;
  decision_id: string;
  tx_hash: string | null;
  block_number: number | null;
  chain_id: number;
  status: "pending" | "confirmed" | "failed";
  anchored_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ChainVerification {
  valid: boolean;
  total_records: number;
  message: string;
}

export interface BlockchainVerification {
  decision_id: string;
  on_chain: boolean;
  hash_match: boolean;
  tx_hash: string | null;
  block_number: number | null;
}
