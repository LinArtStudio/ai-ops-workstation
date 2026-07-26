# Project: ai-ops-workstation（AI 产品运营工作台）

> 全局环境见 `C:\Users\15902\Cursor\AGENTS.md`；协作纪律以 Cursor User Rules 为准。

## 本项目说明

- 用途: 产品/运营工作台（看板、反馈、竞品、周报、增长实验、AI 助手）
- 技术栈: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Ant Design + ECharts；Supabase Auth/RLS；智谱 AI
- 包管理: **npm**（已有 `package-lock.json`）。不要擅自改成 pnpm/yarn，除非单独迁移任务。
- 启动方式:

```powershell
cd C:\Users\15902\Cursor\ai-ops-workstation
npm install
copy .env.example .env.local
npm run dev
```

- 常用脚本: `npm run dev` / `npm run build` / `npm run lint` / `npm run db:migrate` / `npm run verify:stage-a`
- 环境变量名（勿提交真实密钥）: `ZHIPUAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- 部署: **阿里云 VPS + PM2 standalone**（`deploy.ps1` → `/opt/ai-ops-workstation`，端口 3002）。改部署方案前先说明。

## 项目特定约定

- 对话与文档用简体中文；代码注释与 commit message 用英文。
- 版本与依赖以 `package.json` 为准。
- 密钥只放 `.env.local`。
- 最小改动；`scripts/` 下迁移/部署脚本执行前需说明并征得同意。
- 同机其它项目（如 `ai-career-tool`）默认不碰。
