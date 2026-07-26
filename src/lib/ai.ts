// AI工具函数 - 封装智谱AI API调用

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletion {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

const ZHIPUAI_API_KEY = process.env.ZHIPUAI_API_KEY || '';
const ZHIPUAI_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function assertApiKey() {
  if (!ZHIPUAI_API_KEY) {
    throw new Error('ZHIPUAI_API_KEY 未配置');
  }
}

// 通用聊天完成
export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  assertApiKey();

  const {
    model = 'glm-4-flash',
    temperature = 0.7,
    maxTokens = 2048
  } = options;

  const response = await fetch(ZHIPUAI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPUAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`智谱AI API错误: ${response.status} - ${error}`);
  }

  const data: ChatCompletion = await response.json();
  return data.choices[0]?.message?.content || '';
}

// 流式聊天完成
export async function chatCompletionStream(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<ReadableStream> {
  assertApiKey();

  const {
    model = 'glm-4-flash',
    temperature = 0.7,
    maxTokens = 2048
  } = options;

  const response = await fetch(ZHIPUAI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPUAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`智谱AI API错误: ${response.status} - ${error}`);
  }

  return response.body!;
}

// 自然语言查询数据
export async function nlQueryToSQL(userQuestion: string): Promise<string> {
  const systemPrompt = `你是一个数据分析助手。用户会用自然语言询问产品数据问题。

数据库表结构（PostgreSQL）：
- metrics表：id, project_id, metric_name, metric_value, dimension, recorded_at
- metric_name包括：'dau', 'retention', 'conversion', 'revenue'
- dimension是JSONB类型，包含维度信息如{"source": "organic", "device": "mobile"}

用户问题：${userQuestion}

请生成PostgreSQL查询语句，只返回SQL，不要解释。`;

  const sql = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuestion }
  ], { temperature: 0.1 });

  return sql.trim();
}

// 生成运营周报
export async function generateWeeklyReport(
  metricsSummary: string,
  feedbackSummary: string,
  competitorUpdates: string
): Promise<string> {
  const systemPrompt = `你是一个产品运营专家。基于以下数据生成本周运营周报。

本周数据：
${metricsSummary}

用户反馈摘要：
${feedbackSummary}

竞品动态：
${competitorUpdates}

请生成结构化周报，使用Markdown格式，包含：
1. 📊 核心指标变化（用表格展示）
2. 💡 关键洞察（3-5条）
3. ⚠️ 问题与风险
4. 🎯 下周建议（具体可执行）
5. 📝 备注

周报要专业、简洁、有数据支撑。`;

  const report = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '请生成本周运营周报' }
  ], { temperature: 0.7, maxTokens: 4096 });

  return report;
}

// 分析用户反馈
export async function analyzeFeedback(content: string): Promise<{
  category: string;
  sentiment: string;
  priority: number;
  summary: string;
}> {
  const systemPrompt = `你是一个用户反馈分析专家。请分析以下用户反馈，返回JSON格式：

{
  "category": "bug" | "feature" | "ux" | "performance" | "other",
  "sentiment": "positive" | "negative" | "neutral",
  "priority": 1-5 (5最高),
  "summary": "一句话摘要"
}

用户反馈：`;

  const result = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content }
  ], { temperature: 0.1 });

  const fallback = {
    category: 'other',
    sentiment: 'neutral',
    priority: 3,
    summary: content.slice(0, 50),
  };

  try {
    const cleaned = result
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const jsonText =
      start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    const parsed = JSON.parse(jsonText) as {
      category?: string;
      sentiment?: string;
      priority?: number;
      summary?: string;
    };

    const categories = ['bug', 'feature', 'ux', 'performance', 'other'] as const;
    const sentiments = ['positive', 'negative', 'neutral'] as const;
    const category = categories.includes(parsed.category as (typeof categories)[number])
      ? (parsed.category as string)
      : 'other';
    const sentiment = sentiments.includes(
      parsed.sentiment as (typeof sentiments)[number]
    )
      ? (parsed.sentiment as string)
      : 'neutral';
    const priorityNum = Number(parsed.priority);
    const priority =
      Number.isFinite(priorityNum) && priorityNum >= 1 && priorityNum <= 5
        ? Math.round(priorityNum)
        : 3;

    return {
      category,
      sentiment,
      priority,
      summary: String(parsed.summary || content.slice(0, 50)).slice(0, 120),
    };
  } catch {
    return fallback;
  }
}

export interface OpsInsight {
  type: 'opportunity' | 'risk' | 'action';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

/** Generate 3–5 actionable insights from aggregated feedback text. */
export async function generateInsightsFromFeedback(
  feedbackSummary: string
): Promise<OpsInsight[]> {
  const systemPrompt = `你是产品运营专家。基于用户反馈摘要，输出 3 到 5 条可执行洞察。
严格返回 JSON 数组，不要 Markdown，不要解释。每项字段：
{
  "type": "opportunity" | "risk" | "action",
  "title": "短标题",
  "description": "一句话说明原因与建议",
  "priority": "high" | "medium" | "low",
  "source": "用户反馈"
}`;

  const result = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: feedbackSummary },
    ],
    { temperature: 0.3, maxTokens: 1500 }
  );

  try {
    const cleaned = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as OpsInsight[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item?.title && item?.description)
      .slice(0, 5)
      .map((item) => ({
        type: (['opportunity', 'risk', 'action'] as const).includes(item.type)
          ? item.type
          : 'action',
        title: String(item.title).slice(0, 80),
        description: String(item.description).slice(0, 300),
        priority: (['high', 'medium', 'low'] as const).includes(item.priority)
          ? item.priority
          : 'medium',
        source: item.source || '用户反馈',
      }));
  } catch {
    return [
      {
        type: 'action',
        title: '梳理本周高频反馈',
        description: feedbackSummary.slice(0, 200) || '暂无反馈摘要，请先录入用户反馈。',
        priority: 'medium',
        source: '用户反馈',
      },
    ];
  }
}

// 生成竞品分析报告
export async function generateCompetitorAnalysis(
  competitorName: string,
  competitorInfo: string
): Promise<string> {
  const systemPrompt = `你是一个竞品分析专家。基于以下信息生成竞品分析报告。

竞品名称：${competitorName}
竞品信息：
${competitorInfo}

请生成结构化分析报告，使用Markdown格式，包含：
1. 产品概述
2. 核心功能
3. 定价策略
4. 优劣势分析
5. 对我们的启示

分析要深入、有洞察、可执行。`;

  const analysis = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '请生成竞品分析报告' }
  ], { temperature: 0.7, maxTokens: 2048 });

  return analysis;
}
