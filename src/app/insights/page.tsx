// 洞察→行动页面 — Weekly Ops Loop
'use client';

import React, { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  message,
  Row,
  Col,
  Divider,
  Empty,
  Alert,
  Spin,
} from 'antd';
import {
  BulbOutlined,
  FileTextOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useProject } from '@/contexts/ProjectContext';

const { Title, Text } = Typography;

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'action';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

interface Action {
  id: string;
  type: 'prd' | 'task' | 'email';
  title: string;
  content: string;
  status: 'draft' | 'generated';
}

async function requestAiComplete(
  projectId: string,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await fetch('/api/ai/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'AI 请求失败');
  }

  const data = await response.json();
  return data.content as string;
}

const InsightToActionPage: React.FC = () => {
  const { project, loading: projectLoading } = useProject();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string>('');
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null);

  const loadInsightsFromFeedback = async () => {
    if (!project?.id) {
      message.warning('请先选择项目');
      return;
    }

    setLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '洞察生成失败');
      }

      const mapped: Insight[] = (data.insights || []).map(
        (
          item: Omit<Insight, 'id'> & { id?: string },
          index: number
        ) => ({
          id: item.id || `${Date.now()}-${index}`,
          type: item.type,
          title: item.title,
          description: item.description,
          priority: item.priority,
          source: item.source || '用户反馈',
        })
      );

      setInsights(mapped);
      setFeedbackCount(data.feedbackCount ?? mapped.length);
      setSelectedInsight(mapped[0]?.id || '');
      setActions([]);
      message.success(`已基于 ${data.feedbackCount} 条反馈生成洞察`);
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : '洞察生成失败，请稍后重试'
      );
    } finally {
      setLoadingInsights(false);
    }
  };

  const runAction = async (
    insightId: string,
    type: Action['type'],
    promptBuilder: (insight: Insight) => { system: string; user: string }
  ) => {
    if (!project?.id) return;
    const insight = insights.find((i) => i.id === insightId);
    if (!insight) return;

    setGenerating(true);
    setSelectedInsight(insightId);
    try {
      const prompt = promptBuilder(insight);
      const content = await requestAiComplete(
        project.id,
        [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        { temperature: 0.7, maxTokens: 2048 }
      );

      const titles = {
        prd: `PRD: ${insight.title}`,
        task: `任务: ${insight.title}`,
        email: `邮件: ${insight.title}`,
      };

      setActions((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type,
          title: titles[type],
          content,
          status: 'generated',
        },
      ]);
      message.success('生成完成');
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : 'AI服务暂时不可用'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePRD = (insightId: string) =>
    runAction(insightId, 'prd', (insight) => ({
      system: '你是一个产品经理专家，擅长撰写PRD文档。',
      user: `基于以下产品洞察，生成简洁可执行的 PRD（Markdown）：
- 标题：${insight.title}
- 描述：${insight.description}
- 优先级：${insight.priority}
- 来源：${insight.source}

包含：背景、目标、需求详情、验收标准、时间计划。`,
    }));

  const handleGenerateTask = (insightId: string) =>
    runAction(insightId, 'task', (insight) => ({
      system: '你是一个项目管理专家，擅长任务拆解和排期。',
      user: `基于以下洞察生成任务清单（Markdown）：
- 标题：${insight.title}
- 描述：${insight.description}
- 优先级：${insight.priority}

包含：优先级、任务列表（含预计时间）、负责人建议、截止日期、依赖项。`,
    }));

  const handleGenerateEmail = (insightId: string) =>
    runAction(insightId, 'email', (insight) => ({
      system: '你是一个商务沟通专家，擅长撰写专业的商务邮件。',
      user: `基于以下洞察生成一封专业邮件：
- 标题：${insight.title}
- 描述：${insight.description}
- 优先级：${insight.priority}

包含：主题行、问题、影响、建议方案、预期效果、下一步。`,
    }));

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  const handleDownload = (action: Action) => {
    const blob = new Blob([action.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${action.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('下载成功');
  };

  const insightTypeColor = {
    opportunity: 'green',
    risk: 'red',
    action: 'blue',
  } as const;

  const insightTypeText = {
    opportunity: '机会',
    risk: '风险',
    action: '行动',
  } as const;

  const priorityColor = {
    high: 'red',
    medium: 'orange',
    low: 'green',
  } as const;

  if (projectLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            运营周闭环 · 洞察→行动
          </Title>
          <Text type="secondary">
            从本周反馈生成洞察，再一键产出 PRD / 任务 / 邮件
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={loadingInsights}
          onClick={() => void loadInsightsFromFeedback()}
        >
          从本周反馈生成洞察
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          feedbackCount === null
            ? '点击右上角按钮，基于当前项目本周反馈生成真实洞察（不再使用演示数据）'
            : `已加载洞察，来源反馈 ${feedbackCount} 条`
        }
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="数据洞察" style={{ height: '100%' }}>
            {insights.length === 0 ? (
              <Empty description="暂无洞察，请先录入反馈并点击生成" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {insights.map((insight) => (
                  <Card
                    key={insight.id}
                    size="small"
                    style={{
                      border:
                        selectedInsight === insight.id
                          ? '2px solid #1677ff'
                          : '1px solid #f0f0f0',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedInsight(insight.id)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Tag color={insightTypeColor[insight.type]}>
                        {insightTypeText[insight.type]}
                      </Tag>
                      <Tag color={priorityColor[insight.priority]}>
                        {insight.priority === 'high'
                          ? '高'
                          : insight.priority === 'medium'
                            ? '中'
                            : '低'}
                        优先级
                      </Tag>
                    </div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>
                      {insight.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {insight.description}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag>{insight.source}</Tag>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="生成行动" style={{ height: '100%' }}>
            {selectedInsight ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>选中洞察：</Text>
                  <Text>
                    {insights.find((i) => i.id === selectedInsight)?.title}
                  </Text>
                </div>

                <Divider />

                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>
                    选择行动类型：
                  </Text>
                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => void handleGeneratePRD(selectedInsight)}
                      loading={generating}
                    >
                      生成PRD
                    </Button>
                    <Button
                      icon={<CheckCircleOutlined />}
                      onClick={() => void handleGenerateTask(selectedInsight)}
                      loading={generating}
                    >
                      生成任务清单
                    </Button>
                    <Button
                      icon={<RocketOutlined />}
                      onClick={() => void handleGenerateEmail(selectedInsight)}
                      loading={generating}
                    >
                      生成邮件
                    </Button>
                  </Space>
                </div>

                <Divider />

                {actions.length > 0 && (
                  <div>
                    <Text strong style={{ marginBottom: 12, display: 'block' }}>
                      生成结果：
                    </Text>
                    {actions.map((action) => (
                      <Card
                        key={action.id}
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={
                          <Space>
                            {action.type === 'prd' && <FileTextOutlined />}
                            {action.type === 'task' && <CheckCircleOutlined />}
                            {action.type === 'email' && <RocketOutlined />}
                            <Text>{action.title}</Text>
                          </Space>
                        }
                        extra={
                          <Space>
                            <Button
                              type="link"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(action.content)}
                            >
                              复制
                            </Button>
                            <Button
                              type="link"
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownload(action)}
                            >
                              下载
                            </Button>
                          </Space>
                        }
                      >
                        <pre
                          style={{
                            background: '#f5f5f5',
                            padding: 12,
                            borderRadius: 6,
                            maxHeight: 200,
                            overflow: 'auto',
                            fontSize: 12,
                            lineHeight: 1.6,
                          }}
                        >
                          {action.content}
                        </pre>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <BulbOutlined
                  style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}
                />
                <div>
                  <Text type="secondary">
                    请先生成并选择左侧洞察，然后产出行动
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InsightToActionPage;
