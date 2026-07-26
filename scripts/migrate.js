// M0: HTTP/RPC migrate is disabled.
// Apply schema manually via Supabase SQL Editor:
//   supabase/migrations/20260726_m0_auth_rls.sql
//
// See scripts/MIGRATION-GUIDE.md

console.error(
  [
    'Automated migrate.js is disabled for security.',
    'Please run supabase/migrations/20260726_m0_auth_rls.sql in the Supabase SQL Editor.',
    'Guide: scripts/MIGRATION-GUIDE.md',
  ].join('\n')
);
process.exit(1);
