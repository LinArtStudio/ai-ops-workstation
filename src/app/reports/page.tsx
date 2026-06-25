// AI周报生成页面
'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Input, Select, DatePicker, Space, message, Spin, Row, Col, Tag, Divider } from 'antd';
import { FileTextOutlined, RobotOutlined, DownloadOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { generateWeeklyReport } from '@/lib/ai';

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
      // 调用真实AI API生成周报
      const report = await generateWeeklyReport(
        metricsSummary || '暂无数据',
        feedbackSummary || '暂无反馈',
        competitorUpdates || '暂无动态'
      );
      
      setReportContent(report);
      message.success('周报生成完成！');
    } catch (error) {
      console.error('周报生成失败:', error);
      message.error('AI服务暂时不可用，请稍后重试');
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
