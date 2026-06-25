// AI周报生成页面
'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Input, Select, DatePicker, Space, message, Spin, Row, Col, Tag, Divider } from 'antd';
import { FileTextOutlined, RobotOutlined, DownloadOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ReportsPage: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [weekRange, setWeekRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week')
  ]);
  const [metricsSummary, setMetricsSummary] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [competitorUpdates, setCompetitorUpdates] = useState('');

  // 生成周报
  const handleGenerate = async () => {
    if (!metricsSummary && !feedbackSummary && !competitorUpdates) {
      message.warning('请至少填写一项数据');
      return;
    }

    setGenerating(true);
    try {
      // 模拟AI生成
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockReport = `# 📊 产品运营周报

**周期：** ${weekRange[0].format('YYYY-MM-DD')} 至 ${weekRange[1].format('YYYY-MM-DD')}

---

## 一、核心指标变化

| 指标 | 本周 | 上周 | 变化 | 趋势 |
|------|------|------|------|------|
| DAU | 1,250 | 1,111 | +12.5% | 📈 |
| 次日留存 | 45.2% | 43.8% | +1.4% | 📈 |
| 转化率 | 8.7% | 9.8% | -1.1% | 📉 |
| 收入 | ¥15,680 | ¥12,480 | +25.6% | 📈 |

---

## 二、关键洞察

1. **用户增长强劲**：本周DAU较上周增长12.5%，主要来自自然流量和内容营销
2. **留存稳步提升**：次日留存率提升1.4%，说明产品粘性增强
3. **转化率下滑**：转化率下降1.1%，需要关注注册流程优化
4. **收入大幅增长**：收入增长25.6%，付费用户比例提升

---

## 三、用户反馈摘要

### 高频问题（共23条反馈）
- **性能问题**：8条（35%）- 登录页加载慢、数据导出卡顿
- **功能建议**：6条（26%）- 数据导出、批量操作、快捷键
- **体验问题**：5条（22%）- 界面布局、操作流程
- **Bug反馈**：4条（17%）- 表单提交失败、数据不同步

### 情感分析
- 😊 积极：30% - 界面设计、AI功能
- 😐 中性：45% - 功能建议
- 😞 消极：25% - 性能问题、Bug

---

## 四、竞品动态

### 神策数据
- 发布新版本，新增AI智能洞察功能
- 推出中小企业优惠方案

### GrowingIO
- 与某电商平台达成战略合作
- 发布无埋点2.0技术白皮书

### Microsoft Clarity
- 新增AI热力图分析功能
- 支持更多语言版本

---

## 五、下周计划

### 重点任务
1. **优化注册流程**：针对转化率下滑，简化注册步骤
2. **性能优化**：解决登录页加载慢问题
3. **功能迭代**：开发数据导出功能
4. **用户运营**：收集更多用户反馈，建立反馈闭环

### 关键指标目标
- DAU：1,300（+4%）
- 转化率：9.5%（+0.8%）
- 用户满意度：85%+

---

## 六、备注

- 本周完成用户访谈5次，收集深度反馈
- 内容营销带来新用户增长，需持续投入
- 竞品动态需密切关注，及时调整策略

---

*报告生成时间：${new Date().toLocaleString()}*
*AI助手自动生成，仅供参考*`;

      setReportContent(mockReport);
      message.success('周报生成成功！');
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 复制周报
  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    message.success('已复制到剪贴板');
  };

  // 下载周报
  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `运营周报_${weekRange[0].format('YYYYMMDD')}_${weekRange[1].format('YYYYMMDD')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('下载成功');
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>📝 AI周报生成</Title>
        <Text type="secondary">一键生成专业运营周报，智能提炼重点</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 输入区域 */}
        <Col xs={24} lg={10}>
          <Card title="📋 数据输入" style={{ height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>选择周期：</Text>
              <DatePicker.RangePicker
                value={weekRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setWeekRange([dates[0], dates[1]]);
                  }
                }}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>核心指标摘要：</Text>
              <TextArea
                value={metricsSummary}
                onChange={e => setMetricsSummary(e.target.value)}
                placeholder="例如：DAU 1250，较上周+12.5%；留存率45.2%，+1.4%..."
                rows={3}
                style={{ marginTop: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>用户反馈摘要：</Text>
              <TextArea
                value={feedbackSummary}
                onChange={e => setFeedbackSummary(e.target.value)}
                placeholder="例如：本周收到23条反馈，主要集中在性能问题..."
                rows={3}
                style={{ marginTop: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>竞品动态：</Text>
              <TextArea
                value={competitorUpdates}
                onChange={e => setCompetitorUpdates(e.target.value)}
                placeholder="例如：神策数据发布新版本，新增AI功能..."
                rows={3}
                style={{ marginTop: 8 }}
              />
            </div>

            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={handleGenerate}
              loading={generating}
              block
              size="large"
            >
              AI生成周报
            </Button>
          </Card>
        </Col>

        {/* 输出区域 */}
        <Col xs={24} lg={14}>
          <Card
            title="📄 周报预览"
            extra={
              reportContent && (
                <Space>
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
                </Space>
              )
            }
            style={{ height: '100%' }}
          >
            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">AI正在生成周报...</Text>
                </div>
              </div>
            ) : reportContent ? (
              <div style={{ maxHeight: 600, overflow: 'auto', padding: '0 8px' }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  lineHeight: 1.8
                }}>
                  {reportContent}
                </pre>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div>
                  <Text type="secondary">填写左侧数据后，点击"AI生成周报"</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 历史周报 */}
      <Card title="📚 历史周报" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[
            { week: '06.17-06.23', title: '第25周运营周报' },
            { week: '06.10-06.16', title: '第24周运营周报' },
            { week: '06.03-06.09', title: '第23周运营周报' },
            { week: '05.27-06.02', title: '第22周运营周报' }
          ].map((item, index) => (
            <Card
              key={index}
              size="small"
              style={{ width: 200, cursor: 'pointer' }}
              hoverable
            >
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 24, color: '#1677ff', marginBottom: 8 }} />
                <div>
                  <Text strong>{item.title}</Text>
                </div>
                <div>
                  <Text type="secondary">{item.week}</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
