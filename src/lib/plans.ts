export type PlanId = 'free' | 'pro' | 'team';

export const DEFAULT_QUOTA: Record<PlanId, number> = {
  free: 50,
  pro: 500,
  team: 2000,
};

export function normalizePlan(raw: unknown, fallback: PlanId = 'free'): PlanId {
  if (raw === 'pro' || raw === 'team' || raw === 'free') return raw;
  if (raw === 'agency') return 'team';
  return fallback;
}

function csvIds(envName: string): Set<string> {
  const raw = process.env[envName] || '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/** Env override wins over DB row when project id is listed. */
export function envPlanOverride(projectId: string): PlanId | null {
  if (
    csvIds('TEAM_PROJECT_IDS').has(projectId) ||
    csvIds('AGENCY_PROJECT_IDS').has(projectId)
  ) {
    return 'team';
  }
  if (csvIds('PRO_PROJECT_IDS').has(projectId)) return 'pro';
  return null;
}

export function defaultQuotaForPlan(plan: PlanId): number {
  return DEFAULT_QUOTA[plan];
}
