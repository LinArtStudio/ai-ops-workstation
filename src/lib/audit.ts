import type { SupabaseClient } from '@supabase/supabase-js';

export async function writeAuditLog(
  supabase: SupabaseClient,
  input: {
    projectId?: string | null;
    actorId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    meta?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from('audit_logs').insert({
    project_id: input.projectId || null,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    meta: input.meta || null,
  });

  if (error && !error.message?.includes('does not exist')) {
    console.warn('audit log failed:', error.message);
  }
}
