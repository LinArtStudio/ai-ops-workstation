// 首页 - 数据看板
'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Empty, Progress, Space, Tooltip } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  EyeOutlined,
  SwapOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import dynamic from 'next/dynamic';

const { Title, Text, Paragraph } = Typography;

// 动态导入ECharts避免SSR问题
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// 模拟数据
const mockMetrics = {
  dau: { current: 1250, change: '+12.5%', trend: 'up' as string },
  retention: { current: 45.2, change: '+3.2%', trend: 'up' as string },
  conversion: { current: 8.7, change: '-1.2%', trend: 'down' as string },
  revenue: { current: 15680, change: '+25.8%', trend: 'up' as string }
};

const mockRecentActivity = [
  { key: '1', type: '新用户', count: 156, time: '今天', status: 'success' },
  { key: '2', type: '反馈提交', count: 23, time: '今天', status: 'processing' },
  { key: '3', type: '竞品更新', count: 5, time: '昨天', status: 'warning' },
  { key: '4', type: '周报生成', count: 1, time: '昨天', status: 'default' },
];

const mockFeedbackDistribution = [
  { name: 'Bug反馈', value: 35 },
  { name: '功能建议', value: 45 },
  { name: '体验问题', value: 20 },
  { name: '性能问题', value: 15 },
  { name: '其他', value: 10 }
];

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载
    setTimeout(() => setLoading(false), 500);
  }, []);

  // DAU趋势图配置
  const dauTrendOption = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category' as const,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value' as const
      }
    ],
    series: [
      {
        name: 'DAU',
        type: 'bar',
        barWidth: '60%',
        data: [980, 1100, 1050, 1200, 1350, 1500, 1250],
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1677ff' },
              { offset: 1, color: '#69b1ff' }
            ]
          }
        }
      }
    ]
  };

  // 反馈分布饼图配置
  const feedbackPieOption = {
    tooltip: {
      trigger: 'item' as const
    },
    legend: {
      orient: 'vertical' as const,
      left: 'left'
    },
    series: [
      {
        name: '反馈类型',
        type: 'pie',
        radius: '50%',
        data: mockFeedbackDistribution,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // 最近活动表格列
  const activityColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <Text strong>{count}</Text>
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          success: 'green',
          processing: 'blue',
          warning: 'orange',
          default: 'default'
        };
        const textMap: Record<string, string> = {
          success: '成功',
          processing: '处理中',
          warning: '需关注',
          default: '正常'
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">加载数据中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>📊 数据看板</Title>
          <Text type="secondary">实时监控产品核心指标</Text>
        </div>
        <Tag color="orange">演示数据</Tag>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="metric-card"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>日活用户 (DAU)</span>}
              value={mockMetrics.dau.current}
              prefix={<UserOutlined style={{ color: '#fff' }} />}
              suffix={
                <span style={{ fontSize: 14, color: mockMetrics.dau.trend === 'up' ? '#52c41a' : '#ff4d4f' }}>
                  {mockMetrics.dau.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {' '}{mockMetrics.dau.change}
                </span>
              }
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8 }}>
              <Tooltip title="较上周同期">
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  <InfoCircleOutlined /> 较上周 +12.5%
                </Text>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="metric-card"
            style={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>次日留存率</span>}
              value={mockMetrics.retention.current}
              suffix={
                <span>
                  %
                  <span style={{ fontSize: 14, color: mockMetrics.retention.trend === 'up' ? '#52c41a' : '#ff4d4f', marginLeft: 8 }}>
                    {mockMetrics.retention.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {' '}{mockMetrics.retention.change}
                  </span>
                </span>
              }
              prefix={<EyeOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={mockMetrics.retention.current} 
                strokeColor="#fff" 
                trailColor="rgba(255,255,255,0.2)"
                showInfo={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="metric-card"
            style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>转化率</span>}
              value={mockMetrics.conversion.current}
              suffix={
                <span>
                  %
                  <span style={{ fontSize: 14, color: mockMetrics.conversion.trend === 'up' ? '#52c41a' : '#ff4d4f', marginLeft: 8 }}>
                    {mockMetrics.conversion.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {' '}{mockMetrics.conversion.change}
                  </span>
                </span>
              }
              prefix={<SwapOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8 }}>
              <Tooltip title="目标: 10%">
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  <RiseOutlined /> 距目标还差 1.3%
                </Text>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="metric-card"
            style={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>收入 (元)</span>}
              value={mockMetrics.revenue.current}
              prefix={<DollarOutlined style={{ color: '#fff' }} />}
              suffix={
                <span style={{ fontSize: 14, color: mockMetrics.revenue.trend === 'up' ? '#52c41a' : '#ff4d4f' }}>
                  {mockMetrics.revenue.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {' '}{mockMetrics.revenue.change}
                </span>
              }
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8 }}>
              <Tooltip title="月度目标: ¥20,000">
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  <DollarOutlined /> 完成度 78.4%
                </Text>
              </Tooltip>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 DAU趋势（近7天）">
            <ReactECharts option={dauTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="💬 反馈分布">
            <ReactECharts option={feedbackPieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="🔔 最近活动">
            <Table
              columns={activityColumns}
              dataSource={mockRecentActivity}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="💡 AI洞察">
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue">洞察1</Tag>
              <Text>本周DAU较上周增长12.5%，主要来自新用户增长</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Tag color="orange">洞察2</Tag>
              <Text>转化率下降1.2%，建议优化注册流程</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Tag color="green">洞察3</Tag>
              <Text>收入增长25.8%，付费用户比例提升</Text>
            </div>
            <div>
              <Tag color="purple">建议</Tag>
              <Text>关注竞品动态，近期有3个竞品更新了功能</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
