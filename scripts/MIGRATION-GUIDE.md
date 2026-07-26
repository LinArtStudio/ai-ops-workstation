# 数据库迁移指南（Stage A）

> HTTP `/api/migrate` 已永久禁用（410）。用 SQL Editor 或 `npm run db:migrate`。

## 执行顺序（必须）

1. `supabase/migrations/20260726_m0_auth_rls.sql` — Auth 相关表 + RLS  
2. `supabase/migrations/20260726_m0c_invite_audit.sql` — 邀请 + 审计 + accept RPC  
3. `supabase/migrations/20260726_m1_billing_quota.sql` — `project_plans` + `ai_usage_events`  
4. `supabase/migrations/20260726_m1b_plan_team_quota_atomic.sql` — plan=`team` + `consume_ai_quota`

不要运行 `_combined_stage_a.sql`（仅说明占位，migrate 脚本会忽略 `_` 前缀）。

## 推荐方式

### A. 自动（需 token 或 DATABASE_URL）

```powershell
cd C:\Users\15902\Cursor\ai-ops-workstation
# .env.local 中配置 SUPABASE_ACCESS_TOKEN + 项目 ref，或 DATABASE_URL
npm run db:migrate
npm run verify:stage-a
```

### B. 一键打开 SQL Editor

```powershell
npm run db:open-sql
# 或指定文件：
npm run db:open-sql -- --file 20260726_m1_billing_quota.sql
```

在打开的页面清空 → Ctrl+V → Run，确认 Success。

## Auth 配置

1. Supabase → Authentication → Providers → 启用 Email  
2. Redirect URL：`http://localhost:3000/auth/callback` 与生产域名 `/auth/callback`  
3. 本地 `.env.local` 参考 `.env.example`

## 验证

| 检查项 | 期望 |
|---|---|
| 表 `project_members` / `project_invites` / `project_plans` / `ai_usage_events` | API 可见 |
| RPC `consume_ai_quota` | 存在（未登录调用返回 not authenticated） |
| 未登录访问业务页 | 跳转 `/login` |
| `GET /api/migrate` | `410 Gone` |
| `npm run verify:stage-a` | 表检查通过 |

双账号隔离（可选）：在 `.env.local` 配置 `STAGE_A_USER_A_*` / `STAGE_A_USER_B_*` 后重跑 `verify:stage-a`。
