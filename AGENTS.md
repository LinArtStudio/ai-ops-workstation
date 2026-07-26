# Project: ai-ops-workstation（AI 产品运营工作台）

> 全局环境见 `C:\Users\15902\Cursor\AGENTS.md`；协作纪律以 Cursor User Rules 为准。

## 本项目说明

- 用途: 产品/运营工作台（看板、反馈、竞品、周报、增长实验、AI 助手）
- 技术栈: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Ant Design + ECharts；Supabase；智谱 AI
- 包管理: **npm**（已有 `package-lock.json`）。不要擅自改成 pnpm/yarn，除非单独迁移任务。
- 启动方式:

```powershell
cd C:\Users\15902\Cursor\ai-ops-workstation
npm install
copy .env.example .env.local
npm run dev
```

- 常用脚本: `npm run dev` / `npm run build` / `npm run lint`
- 环境变量名（勿提交真实密钥）: `ZHIPUAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- 部署: README 写明 Cloudflare Pages；改部署前先说明方案。

## 项目特定约定

- 对话与文档用简体中文；代码注释与 commit message 用英文。
- README 中部分版本号可能滞后（以 `package.json` 为准）。
- 密钥只放 `.env.local`。
- 最小改动；`scripts/` 下迁移脚本执行前需说明并征得同意。