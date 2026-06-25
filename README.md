# 🚀 AI产品运营工作台

> 用AI驱动产品增长的一站式工作台

## 📋 项目简介

AI产品运营工作台是一个面向产品经理和运营人员的AI驱动工具平台，集成数据看板、用户反馈分析、竞品监控、AI周报生成、增长实验等核心功能，帮助团队用数据驱动增长。

## ✨ 核心功能

### 1. 📊 数据看板
- 核心指标实时监控（DAU、留存、转化、收入）
- 趋势图表可视化
- AI智能洞察

### 2. 💬 用户反馈中心
- 多渠道反馈收集（手动/表单/API）
- AI自动分类+情感分析
- 高频问题聚合
- 需求优先级排序

### 3. 🔍 竞品监控
- 竞品信息管理
- 动态更新追踪
- AI竞品分析报告
- 对比可视化

### 4. 📝 AI周报生成
- 一键生成运营周报
- 智能提炼重点
- 数据自动填入
- Markdown/PDF导出

### 5. 🎯 增长实验
- A/B测试设计
- 实验结果追踪
- 置信度计算
- AI优化建议

### 6. 💡 洞察→行动
- 数据洞察展示
- 一键生成PRD
- 一键生成任务清单
- 一键生成邮件模板

### 7. 🤖 AI助手
- 自然语言查询数据
- 智能异常检测
- 自动生成运营建议
- 对话式交互

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Next.js 14 | SSR + API Routes |
| **UI组件库** | Ant Design 5 | 企业级UI |
| **图表库** | ECharts 5 | 数据可视化 |
| **CSS** | Tailwind CSS | 原子化CSS |
| **AI API** | 智谱AI GLM-4-Flash | 永久免费 |
| **数据库** | Supabase | PostgreSQL + Auth |
| **部署** | Cloudflare Pages | 全球CDN |
| **语言** | TypeScript | 类型安全 |

## 🚀 快速开始

### 1. 克隆项目

```bash
cd ~/hermes-workspace/ai-ops-workstation
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入以下配置：

```env
# 智谱AI API
ZHIPUAI_API_KEY=your_api_key_here

# Supabase (可选)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📁 项目结构

```
ai-ops-workstation/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API路由
│   │   │   ├── ai/chat/        # AI对话API
│   │   │   └── health/         # 健康检查
│   │   ├── ai-assistant/       # AI助手页面
│   │   ├── competitors/        # 竞品监控页面
│   │   ├── experiments/        # 增长实验页面
│   │   ├── feedback/           # 用户反馈页面
│   │   ├── reports/            # AI周报页面
│   │   ├── globals.css         # 全局样式
│   │   ├── layout.tsx          # 主布局
│   │   └── page.tsx            # 首页（数据看板）
│   ├── components/             # 组件
│   │   └── Layout/             # 布局组件
│   ├── lib/                    # 工具函数
│   │   ├── ai.ts               # AI工具函数
│   │   └── supabase.ts         # Supabase客户端
│   └── types/                  # 类型定义
│       └── database.ts         # 数据库类型
├── public/                     # 静态资源
├── .env.local                  # 环境变量
├── package.json                # 项目配置
├── tailwind.config.ts          # Tailwind配置
└── README.md                   # 项目文档
```

## 🎯 使用场景

### 场景1：产品经理日常
- 查看数据看板，了解产品核心指标
- 使用AI助手查询数据，获取洞察
- 处理用户反馈，优化产品体验
- 监控竞品动态，调整产品策略

### 场景2：运营人员工作
- 生成运营周报，汇报工作成果
- 分析用户反馈，发现高频问题
- 设计增长实验，验证优化方案
- 追踪实验结果，数据驱动决策

### 场景3：创业团队协作
- 统一数据视图，对齐团队目标
- AI自动生成报告，节省时间
- 竞品监控，及时调整方向
- 增长实验，快速验证假设

## 💡 核心优势

### 1. AI-Native
- 自然语言查询数据
- AI自动分类反馈
- 智能生成周报
- 异常检测告警

### 2. 一体化平台
- 数据+反馈+竞品+周报+实验
- 无需切换多个工具
- 数据打通，洞察更深

### 3. 零成本入门
- 智谱AI永久免费
- Supabase免费500MB
- Cloudflare免费部署
- 月成本¥0~¥8

### 4. 极简上手
- 5分钟完成配置
- 直观的操作界面
- 丰富的模板示例
- 完善的文档支持

## 🔧 配置说明

### 智谱AI配置

1. 访问 https://open.bigmodel.cn 注册账号
2. 获取API Key
3. 填入 `.env.local` 的 `ZHIPUAI_API_KEY`

### Supabase配置（可选）

1. 访问 https://supabase.com 注册账号
2. 创建项目
3. 获取URL和Anon Key
4. 填入 `.env.local`

## 📊 数据库设计

### 核心表结构

- `projects` - 项目表
- `metrics` - 指标表（时间序列）
- `feedback_items` - 反馈表
- `competitors` - 竞品表
- `reports` - 周报表
- `experiments` - 实验表

详细SQL见 `src/lib/supabase.ts`

## 🚀 部署

### Cloudflare Pages部署

1. 推送代码到GitHub
2. 登录 Cloudflare Pages
3. 连接GitHub仓库
4. 配置环境变量
5. 部署完成

### Vercel部署

```bash
npm i -g vercel
vercel
```

## 📈 路线图

### v1.0（当前版本）
- ✅ 数据看板
- ✅ 用户反馈中心
- ✅ 竞品监控
- ✅ AI周报生成
- ✅ 增长实验
- ✅ AI助手

### v1.1（计划中）
- 🔲 用户认证系统
- 🔲 多项目管理
- 🔲 数据导入导出
- 🔲 团队协作

### v2.0（未来）
- 🔲 实时数据同步
- 🔲 自动化运营
- 🔲 AI Agent
- 🔲 移动端App

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📧 联系方式

- GitHub: https://github.com/LinArtStudio
- Email: 15902234202@163.com

---

**用AI驱动产品增长，让数据说话！** 🚀
