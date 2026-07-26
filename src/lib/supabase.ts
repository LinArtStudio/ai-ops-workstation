/**
 * Compatibility re-export. Prefer `@/lib/supabase/client` in new code.
 * Do not eagerly instantiate the browser client at module load (breaks SSR/build).
 */
export { createClient } from '@/lib/supabase/client';
