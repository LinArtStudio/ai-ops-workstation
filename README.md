# AI 产品运营工作台

面向产品经理与运营的 AI 工作台：反馈分析、竞品、周报、增长实验、洞察与 AI 助手。  
当前阶段（Phase A）：多租户登录、项目成员 RLS、Free/Pro/Team AI 额度骨架。

## 技术栈

以 `package.json` 为准：

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16（App Router，`output: standalone`）+ React 19 |
| UI / 图表 | Ant Design 6、ECharts 6、Tailwind CSS 4 |
| 后端数据 | Supabase（Auth + PostgreSQL + RLS） |
| AI | 智谱 AI（服务端调用，按额度计量） |
| 部署 | 阿里云 VPS + PM2（端口 3002） |

## 本地启动

```powershell
cd C:\Users\15902\Cursor\ai-ops-workstation
npm install
copy .env.example .env.local
# 编辑 .env.local：ZHIPUAI_API_KEY、NEXT_PUBLIC_SUPABASE_*、NEXT_PUBLIC_APP_URL
npm run dev
```

打开 http://localhost:3000 。未登录会跳转到 `/login`。

## 环境变量

见 `.env.example`。密钥只放 `.env.local`，勿提交。

| 变量 | 说明 |
|------|------|
| `ZHIPUAI_API_KEY` | 智谱 API（仅服务端） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | 应用公网/本地根地址（邀请链接用） |

可选：`PRO_PROJECT_IDS` / `TEAM_PROJECT_IDS`（逗号分隔项目 UUID）用于手动升档。

## 数据库迁移（Stage A）

HTTP `/api/migrate` 已禁用（410）。按序执行：

1. `supabase/migrations/20260726_m0_auth_rls.sql`
2. `supabase/migrations/20260726_m0c_invite_audit.sql`
3. `supabase/migrations/20260726_m1_billing_quota.sql`
4. `supabase/migrations/20260726_m1b_plan_team_quota_atomic.sql`

```powershell
npm run db:open-sql          # 打开 SQL Editor 并复制脚本
npm run db:migrate           # 有 Access Token / DATABASE_URL 时自动执行
npm run verify:stage-a       # 表探测 +（可选）双账号隔离
```

详见 `scripts/MIGRATION-GUIDE.md`。

## 部署（阿里云）

唯一推荐入口：

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

脚本会：本地 `standalone` 构建 → 上传 → 切换 `/opt/ai-ops-workstation` → PM2 重启 `ai-ops`。

- 应用：http://114.55.110.19:3002  
- 健康检查：http://114.55.110.19:3002/api/health  
- 服务器须已有 `/opt/ai-ops-workstation/.env.local`

## 主要页面

| 路径 | 说明 |
|------|------|
| `/login` `/signup` | 登录注册 |
| `/pricing` | Free / Pro / Team 说明 |
| `/feedback` | 反馈录入 + AI 分类 + 筛选 |
| `/reports` | AI 周报（汇总反馈） |
| `/competitors` `/experiments` `/insights` `/ai-assistant` | 其它运营模块 |
| `/` | 看板（指标仍为演示数据，主环见反馈→周报） |

## 常用脚本

```powershell
npm run dev
npm run build
npm run lint
npm run db:migrate
npm run verify:stage-a
```

## 仓库

https://github.com/LinArtStudio/ai-ops-workstation

MIT License
