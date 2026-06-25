// 洞察→行动页面
'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Tag, message, Row, Col, Steps, Input, Select, Divider } from 'antd';
import { BulbOutlined, FileTextOutlined, RocketOutlined, CheckCircleOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { chatCompletion } from '@/lib/ai';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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

const InsightToActionPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'opportunity',
      title: '用户留存率提升机会',
      description: '数据显示次日留存率45.2%，低于行业平均50%，建议优化新手引导流程',
      priority: 'high',
      source: '数据分析'
    },
    {
      id: '2',
      type: 'risk',
      title: '竞品功能追赶风险',
      description: '竞品A已上线AI助手功能，我们需要加快迭代速度',
      priority: 'high',
      source: '竞品监控'
    },
    {
      id: '3',
      type: 'action',
      title: '用户反馈高频问题',
      description: '35%的反馈提到"登录慢"，需要优先优化',
      priority: 'medium',
      source: '用户反馈'
    }
  ]);

  const [actions, setActions] = useState<Action[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string>('');

  // 生成PRD
  const handleGeneratePRD = async (insightId: string) => {
    setGenerating(true);
    setSelectedInsight(insightId);

    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    try {
      // 调用真实AI API生成PRD
      const prompt = `你是一个产品经理专家。基于以下产品洞察，生成一份简洁的PRD文档。

产品洞察：
- 标题：${insight.title}
- 描述：${insight.description}
- 优先级：${insight.priority}
- 来源：${insight.source}

请生成PRD文档，包含：
1. 背景
2. 目标
3. 需求详情（功能需求和非功能需求）
4. 验收标准
5. 时间计划

使用Markdown格式，内容要专业、可执行。`;

      const content = await chatCompletion([
        { role: 'system', content: '你是一个产品经理专家，擅长撰写PRD文档。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.7, maxTokens: 2048 });

      const newAction: Action = {
        id: Date.now().toString(),
        type: 'prd',
        title: `PRD: ${insight.title}`,
        content: content,
        status: 'generated'
      };

      setActions(prev => [...prev, newAction]);
      message.success('PRD生成完成！');
    } catch (error) {
      console.error('PRD生成失败:', error);
      message.error('AI服务暂时不可用，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 生成任务
  const handleGenerateTask = async (insightId: string) => {
    setGenerating(true);
    setSelectedInsight(insightId);

    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    try {
      // 调用真实AI API生成任务清单
      const prompt = `你是一个项目管理专家。基于以下产品洞察，生成一份任务清单。

产品洞察：
- 标题：${insight.title}
- 描述：${insight.description}
- 优先级：${insight.priority}
- 来源：${insight.source}

请生成任务清单，包含：
1. 优先级标注
2. 任务列表（每个任务包含预计时间）
3. 负责人建议
4. 截止日期建议
5. 依赖项说明

使用Markdown格式，任务要具体、可执行。`;

      const content = await chatCompletion([
        { role: 'system', content: '你是一个项目管理专家，擅长任务拆解和排期。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.7, maxTokens: 1500 });

      const newAction: Action = {
        id: Date.now().toString(),
        type: 'task',
        title: `任务: ${insight.title}`,
        content: content,
        status: 'generated'
      };

      setActions(prev => [...prev, newAction]);
      message.success('任务清单生成完成！');
    } catch (error) {
      console.error('任务生成失败:', error);
      message.error('AI服务暂时不可用，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 生成邮件
  const handleGenerateEmail = async (insightId: string) => {
    setGenerating(true);
    setSelectedInsight(insightId);

    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    try {
      // 调用真实AI API生成邮件
      const prompt = `你是一个商务沟通专家。基于以下产品洞察，生成一封专业的邮件。

产品洞察：
- 标题：${insight.title}
- 描述：${insight.description}
- 优先级：${insight.priority}
- 来源：${insight.source}

请生成邮件，包含：
1. 主题行
2. 问题描述
3. 影响范围
4. 建议方案
5. 预期效果
6. 下一步行动

使用专业的商务邮件格式，语气要正式、有说服力。`;

      const content = await chatCompletion([
        { role: 'system', content: '你是一个商务沟通专家，擅长撰写专业的商务邮件。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.7, maxTokens: 1500 });

      const newAction: Action = {
        id: Date.now().toString(),
        type: 'email',
        title: `邮件: ${insight.title}`,
        content: content,
        status: 'generated'
      };

      setActions(prev => [...prev, newAction]);
      message.success('邮件生成完成！');
    } catch (error) {
      console.error('邮件生成失败:', error);
      message.error('AI服务暂时不可用，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 复制内容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  // 下载内容
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

  // 洞察类型颜色
  const insightTypeColor = {
    opportunity: 'green',
    risk: 'red',
    action: 'blue'
  };

  // 洞察类型文本
  const insightTypeText = {
    opportunity: '机会',
    risk: '风险',
    action: '行动'
  };

  // 优先级颜色
  const priorityColor = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>💡 洞察→行动</Title>
        <Text type="secondary">将数据洞察转化为可执行的PRD、任务和邮件</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：洞察列表 */}
        <Col xs={24} lg={10}>
          <Card title="📊 数据洞察" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {insights.map(insight => (
                <Card
                  key={insight.id}
                  size="small"
                  style={{
                    border: selectedInsight === insight.id ? '2px solid #1677ff' : '1px solid #f0f0f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedInsight(insight.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Tag color={insightTypeColor[insight.type]}>
                      {insightTypeText[insight.type]}
                    </Tag>
                    <Tag color={priorityColor[insight.priority]}>
                      {insight.priority === 'high' ? '高' : insight.priority === 'medium' ? '中' : '低'}优先级
                    </Tag>
                  </div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>{insight.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{insight.description}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag>{insight.source}</Tag>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧：行动生成 */}
        <Col xs={24} lg={14}>
          <Card title="🚀 生成行动" style={{ height: '100%' }}>
            {selectedInsight ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>选中洞察：</Text>
                  <Text>{insights.find(i => i.id === selectedInsight)?.title}</Text>
                </div>

                <Divider />

                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>选择行动类型：</Text>
                  <Space>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => handleGeneratePRD(selectedInsight)}
                      loading={generating}
                    >
                      生成PRD
                    </Button>
                    <Button
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleGenerateTask(selectedInsight)}
                      loading={generating}
                    >
                      生成任务清单
                    </Button>
                    <Button
                      icon={<RocketOutlined />}
                      onClick={() => handleGenerateEmail(selectedInsight)}
                      loading={generating}
                    >
                      生成邮件
                    </Button>
                  </Space>
                </div>

                <Divider />

                {/* 生成结果 */}
                {actions.length > 0 && (
                  <div>
                    <Text strong style={{ marginBottom: 12, display: 'block' }}>生成结果：</Text>
                    {actions.map(action => (
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
                        <pre style={{
                          background: '#f5f5f5',
                          padding: 12,
                          borderRadius: 6,
                          maxHeight: 200,
                          overflow: 'auto',
                          fontSize: 12,
                          lineHeight: 1.6
                        }}>
                          {action.content}
                        </pre>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <BulbOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div>
                  <Text type="secondary">请选择左侧的洞察，然后生成对应的行动</Text>
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
