# 数据库迁移指南（M0）

> HTTP `/api/migrate` 已永久禁用。请在 Supabase SQL Editor 手动执行迁移脚本。

## 推荐：自动执行（无需打开 SQL Editor）

在 `.env.local` 配置 `DATABASE_URL`（Supabase → Database → Connection string URI）后：

```powershell
cd C:\Users\15902\Cursor\ai-ops-workstation
npm run db:migrate
npm run verify:stage-a
```

仅补邀请/审计表时：

```powershell
npm run db:migrate:m0c
```

## 步骤（备用：Dashboard 手工）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 你的项目 → **SQL Editor**
2. 新建查询，按顺序执行：

`supabase/migrations/20260726_m0_auth_rls.sql`  
`supabase/migrations/20260726_m0c_invite_audit.sql`

该脚本会：

- **先**创建 `projects`，再创建 `project_members`（修复建表顺序）
- 确保业务表存在（feedback_items / reports / …）
- 删除旧的 `USING (true)` 全开放策略
- 启用按登录用户 + 项目成员的 RLS
- **禁止**任意用户自助加入他人项目（仅项目 owner 可插入成员）

3. 到 **Authentication → Providers** 确认 Email 已启用  
4. 若启用邮箱确认，把 Redirect URL 配为：`https://你的域名/auth/callback`（本地：`http://localhost:3000/auth/callback`）
5. 本地配置 `.env.local`（参考 `.env.example`）后执行：

```powershell
cd C:\Users\15902\Cursor\ai-ops-workstation
npm install
npm run dev
```

6. 浏览器访问 `http://localhost:3000/signup` 注册并验证默认项目是否自动创建

## 若你以前跑过旧版 M0

直接**重新执行**同一份 `20260726_m0_auth_rls.sql` 即可：脚本会 `DROP POLICY IF EXISTS` 后重建更安全的策略。

## 验证

| 检查项 | 期望 |
|---|---|
| Table Editor 有 `project_members` | ✅ |
| 未登录访问 `/feedback` | 跳转 `/login` |
| 登录后顶栏 | 可切换/新建项目 |
| 用户反馈 → AI 周报 → 洞察→行动 | 能走通并保存周报 |
| `GET /api/migrate` | `410 Gone` |

## 安全自检（推荐）

用两个测试账号 A/B：

1. A 创建项目并写入反馈  
2. B **不能**在 Table Editor / API 中把自己 insert 进 A 的 `project_members`  
3. B **读不到** A 的 `feedback_items` / `reports`
