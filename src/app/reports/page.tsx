// AI周报生成页面 — Weekly Ops Loop
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Input,
  DatePicker,
  Space,
  message,
  Spin,
  Row,
  Col,
  Empty,
  Alert,
} from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  DownloadOutlined,
  CopyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import type { Report } from '@/types/database';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ReportsPage: React.FC = () => {
  const { project, loading: projectLoading } = useProject();
  const [generating, setGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [history, setHistory] = useState<Report[]>([]);
  const [weekRange, setWeekRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);
  const [metricsSummary, setMetricsSummary] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [competitorUpdates, setCompetitorUpdates] = useState('');

  const loadHistory = useCallback(async () => {
    if (!project?.id) return;
    setLoadingHistory(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setHistory((data || []) as Report[]);
    } catch (err) {
      console.error('load reports failed:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [project?.id]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleGenerate = async () => {
    if (!project?.id) {
      message.warning('请先选择项目');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          weekStart: weekRange[0].format('YYYY-MM-DD'),
          weekEnd: weekRange[1].format('YYYY-MM-DD'),
          metricsSummary,
          feedbackSummary,
          competitorUpdates,
          autoAggregate: true,
          persist: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '周报生成失败');
      }

      setReportContent(data.report);
      message.success(
        `周报已生成并保存（本周反馈 ${data.counts?.feedbackCount ?? 0} 条）`
      );
      await loadHistory();
    } catch (error) {
      console.error('周报生成失败:', error);
      message.error(
        error instanceof Error ? error.message : 'AI服务暂时不可用，请稍后重试'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    message.success('已复制到剪贴板');
  };

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

  if (projectLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          运营周闭环 · AI 周报
        </Title>
        <Text type="secondary">
          自动汇总本周反馈/指标/竞品 → 生成周报并落库（也可手动补充摘要）
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="推荐路径：先在「用户反馈」录入几条 → 回到这里一键生成周报 → 再到「洞察→行动」拆任务"
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="数据输入" style={{ height: '100%' }}>
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
              <Text strong>核心指标摘要（可选，留空则自动汇总）：</Text>
              <TextArea
                value={metricsSummary}
                onChange={(e) => setMetricsSummary(e.target.value)}
                placeholder="例如：DAU 1250，较上周+12.5%..."
                rows={3}
                style={{ marginTop: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>用户反馈补充（可选）：</Text>
              <TextArea
                value={feedbackSummary}
                onChange={(e) => setFeedbackSummary(e.target.value)}
                placeholder="留空将自动读取本周已入库反馈"
                rows={3}
                style={{ marginTop: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>竞品动态补充（可选）：</Text>
              <TextArea
                value={competitorUpdates}
                onChange={(e) => setCompetitorUpdates(e.target.value)}
                placeholder="留空将自动读取项目竞品备注"
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
              AI 生成并保存周报
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="周报预览"
            extra={
              reportContent ? (
                <Space>
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>
                    复制
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                    下载
                  </Button>
                </Space>
              ) : null
            }
            style={{ height: '100%' }}
          >
            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">正在汇总数据并生成周报...</Text>
                </div>
              </div>
            ) : reportContent ? (
              <div style={{ maxHeight: 600, overflow: 'auto', padding: '0 8px' }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: 1.8,
                  }}
                >
                  {reportContent}
                </pre>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <FileTextOutlined
                  style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}
                />
                <div>
                  <Text type="secondary">
                    点击「AI 生成并保存周报」，将自动汇总项目数据
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="历史周报"
        style={{ marginTop: 24 }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => void loadHistory()}
            loading={loadingHistory}
          >
            刷新
          </Button>
        }
      >
        {history.length === 0 ? (
          <Empty description="暂无已保存周报" />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {history.map((item) => (
              <Card
                key={item.id}
                size="small"
                style={{ width: 220, cursor: 'pointer' }}
                hoverable
                onClick={() => setReportContent(item.content || '')}
              >
                <div style={{ textAlign: 'center' }}>
                  <FileTextOutlined
                    style={{ fontSize: 24, color: '#1677ff', marginBottom: 8 }}
                  />
                  <div>
                    <Text strong>
                      {item.week_start} ~ {item.week_end}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      {dayjs(item.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
