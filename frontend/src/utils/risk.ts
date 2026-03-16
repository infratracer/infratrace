import type { RiskLevel, DecisionType } from "../types";

export function riskBadgeVariant(level: RiskLevel) {
  const map = {
    low: "risk-low" as const,
    medium: "risk-medium" as const,
    high: "risk-high" as const,
    critical: "risk-critical" as const,
  };
  return map[level];
}

export function decisionTypeBadgeVariant(type: DecisionType) {
  const map = {
    scope_change: "type-scope" as const,
    cost_revision: "type-cost" as const,
    assumption_change: "type-assumption" as const,
    contractor_change: "type-contractor" as const,
    schedule_change: "type-schedule" as const,
    risk_acceptance: "type-risk" as const,
    approval: "type-approval" as const,
  };
  return map[type];
}

export function decisionTypeLabel(type: DecisionType): string {
  const map: Record<DecisionType, string> = {
    scope_change: "Scope Change",
    cost_revision: "Cost Revision",
    assumption_change: "Assumption Change",
    contractor_change: "Contractor Change",
    schedule_change: "Schedule Change",
    risk_acceptance: "Risk Acceptance",
    approval: "Approval",
  };
  return map[type];
}

export function riskColor(level: RiskLevel): string {
  const map = {
    low: "#32D74B",
    medium: "#FF9F0A",
    high: "#FF453A",
    critical: "#FF453A",
  };
  return map[level];
}

export function budgetDriftPct(budget: number, spent: number): number {
  if (budget === 0) return 0;
  return ((spent - budget) / budget) * 100;
}
