import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  DEFAULT_QUOTA,
  defaultQuotaForPlan,
  envPlanOverride,
  normalizePlan,
  type PlanId,
} from '@/lib/plans';

export type { PlanId };
export { envPlanOverride, defaultQuotaForPlan } from '@/lib/plans';

export interface QuotaStatus {
  plan: PlanId;
  used: number;
  quota: number;
  remaining: number;
  storage: 'project_plans' | 'audit_logs_fallback';
}

function monthStartIso() {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

function planForProject(projectId: string): PlanId {
  return envPlanOverride(projectId) || 'free';
}

function isMissingRpc(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST202' || error.code === '42883') return true;
  return /Could not find the function|function .* does not exist/i.test(
    error.message || ''
  );
}

function quotaUnavailable(message: string, status: QuotaStatus | null = null) {
  return {
    ok: false as const,
    status,
    error: NextResponse.json(
      {
        error: message,
        code: 'QUOTA_UNAVAILABLE',
        quota: status,
      },
      { status: 503 }
    ),
  };
}

function quotaExceeded(status: QuotaStatus) {
  return {
    ok: false as const,
    status,
    error: NextResponse.json(
      {
        error: `本月 AI 额度不足（已用 ${status.used}/${status.quota}）。可升级 Pro/Team 或下月重置。`,
        code: 'AI_QUOTA_EXCEEDED',
        quota: status,
      },
      { status: 402 }
    ),
  };
}

async function tableExists(
  supabase: SupabaseClient,
  table: 'project_plans' | 'ai_usage_events' | 'audit_logs'
): Promise<boolean> {
  const { error } = await supabase.from(table).select('*').limit(1);
  if (!error) return true;
  if (
    error.code === 'PGRST205' ||
    /does not exist|Could not find the table/i.test(error.message)
  ) {
    return false;
  }
  return true;
}

/** Sync env upgrade into project_plans so RPC sees the right quota. */
async function syncEnvPlanOverride(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const override = envPlanOverride(projectId);
  if (!override) return;

  const quota = defaultQuotaForPlan(override);
  const { data: existing } = await supabase
    .from('project_plans')
    .select('plan, ai_quota_monthly')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('project_plans').insert({
      project_id: projectId,
      plan: override,
      ai_quota_monthly: quota,
    });
    return;
  }

  if (
    normalizePlan(existing.plan) !== override ||
    (existing.ai_quota_monthly ?? 0) < quota
  ) {
    await supabase
      .from('project_plans')
      .update({
        plan: override,
        ai_quota_monthly: Math.max(existing.ai_quota_monthly ?? 0, quota),
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);
  }
}

async function getQuotaFromPlansTable(
  supabase: SupabaseClient,
  projectId: string
): Promise<QuotaStatus | null> {
  const hasPlans = await tableExists(supabase, 'project_plans');
  const hasUsage = await tableExists(supabase, 'ai_usage_events');
  if (!hasPlans || !hasUsage) return null;

  await syncEnvPlanOverride(supabase, projectId);

  let plan: PlanId = planForProject(projectId);
  let quota = DEFAULT_QUOTA[plan];

  const { data: existing } = await supabase
    .from('project_plans')
    .select('plan, ai_quota_monthly')
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    const override = envPlanOverride(projectId);
    plan = override || normalizePlan(existing.plan, plan);
    quota = override
      ? Math.max(existing.ai_quota_monthly ?? 0, DEFAULT_QUOTA[override])
      : (existing.ai_quota_monthly ?? DEFAULT_QUOTA[plan]);
  } else {
    const { error: insertError } = await supabase.from('project_plans').insert({
      project_id: projectId,
      plan,
      ai_quota_monthly: quota,
    });
    if (insertError) {
      console.warn('project_plans insert failed:', insertError.message);
    }
  }

  const { data: usedRaw, error: rpcError } = await supabase.rpc('ai_usage_month', {
    p_project_id: projectId,
  });

  let used = 0;
  if (!rpcError && typeof usedRaw === 'number') {
    used = usedRaw;
  } else {
    const { data: rows } = await supabase
      .from('ai_usage_events')
      .select('units')
      .eq('project_id', projectId)
      .gte('created_at', monthStartIso());
    used = (rows || []).reduce((sum, row) => sum + (Number(row.units) || 0), 0);
  }

  return {
    plan,
    used,
    quota,
    remaining: Math.max(0, quota - used),
    storage: 'project_plans',
  };
}

async function getQuotaFromAuditFallback(
  supabase: SupabaseClient,
  projectId: string
): Promise<QuotaStatus | null> {
  const hasAudit = await tableExists(supabase, 'audit_logs');
  if (!hasAudit) return null;

  const plan = planForProject(projectId);
  const quota = DEFAULT_QUOTA[plan];

  const { data: rows } = await supabase
    .from('audit_logs')
    .select('meta')
    .eq('project_id', projectId)
    .eq('action', 'ai.quota.consume')
    .gte('created_at', monthStartIso());

  const used = (rows || []).reduce((sum, row) => {
    const meta = (row.meta || {}) as { units?: number };
    return sum + (Number(meta.units) || 1);
  }, 0);

  return {
    plan,
    used,
    quota,
    remaining: Math.max(0, quota - used),
    storage: 'audit_logs_fallback',
  };
}

export async function getQuotaStatus(
  supabase: SupabaseClient,
  projectId: string
): Promise<QuotaStatus> {
  const fromTables = await getQuotaFromPlansTable(supabase, projectId);
  if (fromTables) return fromTables;
  const fallback = await getQuotaFromAuditFallback(supabase, projectId);
  if (fallback) return fallback;
  const plan = planForProject(projectId);
  return {
    plan,
    used: 0,
    quota: DEFAULT_QUOTA[plan],
    remaining: DEFAULT_QUOTA[plan],
    storage: 'audit_logs_fallback',
  };
}

function statusFromRpc(raw: Record<string, unknown>): QuotaStatus {
  return {
    plan: normalizePlan(raw.plan, 'free'),
    used: Number(raw.used) || 0,
    quota: Number(raw.quota) || 0,
    remaining: Number(raw.remaining) || 0,
    storage: 'project_plans',
  };
}

export async function consumeAiQuota(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    user: User;
    feature: string;
    units?: number;
    meta?: Record<string, unknown>;
  }
): Promise<
  | { ok: true; status: QuotaStatus }
  | { ok: false; error: NextResponse; status: QuotaStatus | null }
> {
  const units = input.units && input.units > 0 ? Math.floor(input.units) : 1;

  const hasPlans = await tableExists(supabase, 'project_plans');
  if (hasPlans) {
    await syncEnvPlanOverride(supabase, input.projectId);
  }

  const { data: rpcRaw, error: rpcError } = await supabase.rpc('consume_ai_quota', {
    p_project_id: input.projectId,
    p_feature: input.feature,
    p_units: units,
    p_meta: input.meta || null,
  });

  if (!rpcError && rpcRaw && typeof rpcRaw === 'object') {
    const payload = rpcRaw as Record<string, unknown>;
    const status = statusFromRpc(payload);
    if (payload.ok === false) return quotaExceeded(status);
    return { ok: true, status };
  }

  if (rpcError && !isMissingRpc(rpcError)) {
    console.error('consume_ai_quota RPC failed:', rpcError.message);
    return quotaUnavailable('额度服务暂时不可用，请稍后重试');
  }

  const status = await getQuotaStatus(supabase, input.projectId);

  if (status.remaining < units) {
    return quotaExceeded(status);
  }

  if (status.storage === 'project_plans') {
    const { error } = await supabase.from('ai_usage_events').insert({
      project_id: input.projectId,
      user_id: input.user.id,
      feature: input.feature,
      units,
      meta: input.meta || null,
    });
    if (error) {
      console.error('ai_usage_events insert failed:', error.message);
      return quotaUnavailable(
        '额度记账失败，已阻止本次 AI 调用。请确认已执行 M1/M1b 迁移。',
        status
      );
    }
  } else {
    const hasAudit = await tableExists(supabase, 'audit_logs');
    if (!hasAudit) {
      return quotaUnavailable(
        '计费表未就绪（缺少 project_plans / ai_usage_events）。请先执行 M1/M1b SQL。',
        status
      );
    }
    const { error } = await supabase.from('audit_logs').insert({
      project_id: input.projectId,
      actor_id: input.user.id,
      action: 'ai.quota.consume',
      entity_type: 'ai',
      entity_id: input.feature,
      meta: {
        feature: input.feature,
        units,
        ...(input.meta || {}),
      },
    });
    if (error) {
      console.error('audit quota insert failed:', error.message);
      return quotaUnavailable(
        '额度记账失败，已阻止本次 AI 调用。',
        status
      );
    }
  }

  return {
    ok: true,
    status: {
      ...status,
      used: status.used + units,
      remaining: Math.max(0, status.remaining - units),
    },
  };
}
