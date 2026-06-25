// 洞察→行动页面
'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Tag, message, Row, Col, Steps, Input, Select, Divider } from 'antd';
import { BulbOutlined, FileTextOutlined, RocketOutlined, CheckCircleOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';

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

    // 模拟AI生成
    await new Promise(resolve => setTimeout(resolve, 2000));

    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    const newAction: Action = {
      id: Date.now().toString(),
      type: 'prd',
      title: `PRD: ${insight.title}`,
      content: `# 产品需求文档

## 1. 背景
${insight.description}

## 2. 目标
- 提升用户体验
- 解决核心痛点
- 增强产品竞争力

## 3. 需求详情
### 3.1 功能需求
- [ ] 需求1：优化新手引导流程
- [ ] 需求2：添加进度提示
- [ ] 需求3：优化加载速度

### 3.2 非功能需求
- 性能：页面加载时间 < 2秒
- 可用性：支持移动端适配
- 安全性：符合数据安全规范

## 4. 验收标准
- [ ] 用户留存率提升5%
- [ ] 用户满意度达到90%
- [ ] 无P0级bug

## 5. 时间计划
- 需求评审：2026-06-27
- 开发完成：2026-07-03
- 测试完成：2026-07-05
- 上线发布：2026-07-06`,
      status: 'generated'
    };

    setActions(prev => [...prev, newAction]);
    setGenerating(false);
    message.success('PRD生成完成！');
  };

  // 生成任务
  const handleGenerateTask = async (insightId: string) => {
    setGenerating(true);
    setSelectedInsight(insightId);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    const newAction: Action = {
      id: Date.now().toString(),
      type: 'task',
      title: `任务: ${insight.title}`,
      content: `## 任务清单

### 优先级：${insight.priority === 'high' ? '🔴 高' : insight.priority === 'medium' ? '🟡 中' : '🟢 低'}

### 任务列表
1. **需求分析** (预计2小时)
   - 深入分析问题根因
   - 收集用户反馈
   - 确定解决方案

2. **方案设计** (预计4小时)
   - 设计技术方案
   - 评审可行性
   - 确定实现路径

3. **开发实现** (预计8小时)
   - 编写代码
   - 单元测试
   - 代码审查

4. **测试验收** (预计4小时)
   - 功能测试
   - 性能测试
   - 用户验收

### 负责人：待分配
### 截止日期：2026-07-06
### 依赖项：无`,
      status: 'generated'
    };

    setActions(prev => [...prev, newAction]);
    setGenerating(false);
    message.success('任务清单生成完成！');
  };

  // 生成邮件
  const handleGenerateEmail = async (insightId: string) => {
    setGenerating(true);
    setSelectedInsight(insightId);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    const newAction: Action = {
      id: Date.now().toString(),
      type: 'email',
      title: `邮件: ${insight.title}`,
      content: `主题：【产品优化建议】${insight.title}

Hi 团队，

基于最近的数据分析和用户反馈，我发现了一个重要的优化机会：

## 问题描述
${insight.description}

## 影响范围
- 影响用户：所有新用户
- 影响指标：次日留存率
- 优先级：${insight.priority === 'high' ? '高' : insight.priority === 'medium' ? '中' : '低'}

## 建议方案
1. 立即行动：优化新手引导流程
2. 短期计划：添加进度提示和帮助文档
3. 长期规划：建立用户反馈闭环

## 预期效果
- 留存率提升：5-10%
- 用户满意度：提升15%
- 转化率：提升8%

## 下一步
请各位在明天下午5点前回复意见，我们将安排周四下午2点的需求评审会。

Best regards,
AI产品运营助手`,
      status: 'generated'
    };

    setActions(prev => [...prev, newAction]);
    setGenerating(false);
    message.success('邮件生成完成！');
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
