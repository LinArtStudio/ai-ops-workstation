// 增长实验页面
'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Typography, message, Space, Tooltip, Row, Col, Progress, Statistic } from 'antd';
import { PlusOutlined, ExperimentOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, RobotOutlined } from '@ant-design/icons';
import EmptyState from '@/components/EmptyState';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  metricName: string;
  result?: {
    aValue: number;
    bValue: number;
    lift: string;
    confidence: number;
  };
  status: 'draft' | 'running' | 'completed';
  createdAt: string;
}

const ExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: '1',
      name: '注册流程优化',
      hypothesis: '简化注册步骤可以提升注册转化率',
      variantA: '当前3步注册流程',
      variantB: '简化为1步注册（仅手机号）',
      metricName: '注册转化率',
      result: {
        aValue: 8.7,
        bValue: 12.3,
        lift: '+41.4%',
        confidence: 0.95
      },
      status: 'completed',
      createdAt: '2026-06-20'
    },
    {
      id: '2',
      name: '首页CTA按钮颜色',
      hypothesis: '蓝色按钮比绿色按钮更能吸引点击',
      variantA: '绿色按钮（当前）',
      variantB: '蓝色按钮',
      metricName: '按钮点击率',
      result: {
        aValue: 3.2,
        bValue: 3.8,
        lift: '+18.7%',
        confidence: 0.87
      },
      status: 'completed',
      createdAt: '2026-06-18'
    },
    {
      id: '3',
      name: '定价页面展示',
      hypothesis: '展示用户评价可以提升付费转化',
      variantA: '无用户评价',
      variantB: '展示3条用户好评',
      metricName: '付费转化率',
      status: 'running',
      createdAt: '2026-06-22'
    },
    {
      id: '4',
      name: '邮件通知频率',
      hypothesis: '减少通知频率可以降低退订率',
      variantA: '每天发送',
      variantB: '每周发送',
      metricName: '退订率',
      status: 'draft',
      createdAt: '2026-06-24'
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 状态颜色映射
  const statusColorMap: Record<string, string> = {
    draft: 'default',
    running: 'processing',
    completed: 'success'
  };

  // 状态文本映射
  const statusTextMap: Record<string, string> = {
    draft: '草稿',
    running: '运行中',
    completed: '已完成'
  };

  // 状态图标映射
  const statusIconMap: Record<string, React.ReactNode> = {
    draft: <PauseCircleOutlined />,
    running: <PlayCircleOutlined />,
    completed: <CheckCircleOutlined />
  };

  // 添加实验
  const handleAdd = async (values: {
    name: string;
    hypothesis: string;
    variantA: string;
    variantB: string;
    metricName: string;
  }) => {
    try {
      const newExperiment: Experiment = {
        id: Date.now().toString(),
        name: values.name,
        hypothesis: values.hypothesis,
        variantA: values.variantA,
        variantB: values.variantB,
        metricName: values.metricName,
        status: 'draft',
        createdAt: new Date().toLocaleDateString()
      };

      setExperiments(prev => [newExperiment, ...prev]);
      setModalVisible(false);
      form.resetFields();
      message.success('实验创建成功');
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 开始实验
  const handleStart = (id: string) => {
    setExperiments(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'running' } : e
    ));
    message.success('实验已开始');
  };

  // 完成实验
  const handleComplete = (id: string) => {
    setExperiments(prev => prev.map(e =>
      e.id === id
        ? {
          ...e,
          status: 'completed',
          result: {
            aValue: Math.random() * 10,
            bValue: Math.random() * 10 + 5,
            lift: `+${(Math.random() * 50 + 10).toFixed(1)}%`,
            confidence: 0.9 + Math.random() * 0.09
          }
        }
        : e
    ));
    message.success('实验已完成');
  };

  // AI分析实验
  const handleAiAnalyze = (id: string) => {
    message.info('AI正在分析实验结果...');
    setTimeout(() => {
      message.success('AI分析完成：建议采用变体B，预计可提升转化率35%');
    }, 1500);
  };

  // 表格列
  const columns = [
    {
      title: '实验名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Experiment) => (
        <div>
          <Text strong>{name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.hypothesis}</Text>
          </div>
        </div>
      )
    },
    {
      title: '测试指标',
      dataIndex: 'metricName',
      key: 'metricName',
      render: (metric: string) => <Tag color="blue">{metric}</Tag>
    },
    {
      title: '变体A',
      dataIndex: 'variantA',
      key: 'variantA',
      ellipsis: true
    },
    {
      title: '变体B',
      dataIndex: 'variantB',
      key: 'variantB',
      ellipsis: true
    },
    {
      title: '结果',
      key: 'result',
      render: (_: unknown, record: Experiment) => {
        if (!record.result) return <Text type="secondary">-</Text>;
        return (
          <div>
            <div>
              <Text>A: {record.result.aValue.toFixed(1)}%</Text>
            </div>
            <div>
              <Text>B: {record.result.bValue.toFixed(1)}%</Text>
            </div>
            <div>
              <Tag color={record.result.lift.startsWith('+') ? 'green' : 'red'}>
                {record.result.lift}
              </Tag>
            </div>
          </div>
        );
      }
    },
    {
      title: '置信度',
      key: 'confidence',
      render: (_: unknown, record: Experiment) => {
        if (!record.result) return <Text type="secondary">-</Text>;
        const percent = record.result.confidence * 100;
        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={percent >= 95 ? 'success' : 'active'}
              format={() => `${percent.toFixed(0)}%`}
            />
          </div>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={statusIconMap[status]} color={statusColorMap[status]}>
          {statusTextMap[status]}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Experiment) => (
        <Space>
          {record.status === 'draft' && (
            <Tooltip title="开始实验">
              <Button type="link" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)} />
            </Tooltip>
          )}
          {record.status === 'running' && (
            <Tooltip title="完成实验">
              <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)} />
            </Tooltip>
          )}
          {record.status === 'completed' && (
            <Tooltip title="AI分析">
              <Button type="link" icon={<RobotOutlined />} onClick={() => handleAiAnalyze(record.id)} />
            </Tooltip>
          )}
          <Button type="link" size="small">
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🎯 增长实验</Title>
          <Text type="secondary">设计A/B测试，追踪实验结果，AI优化建议</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建实验
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="总实验数"
              value={experiments.length}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="运行中"
              value={experiments.filter(e => e.status === 'running').length}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={experiments.filter(e => e.status === 'completed').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 实验列表 */}
      <Card>
        {experiments.length === 0 ? (
          <EmptyState
            title="暂无实验"
            description="点击下方按钮创建第一个增长实验"
            actionText="创建实验"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={experiments}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 创建实验弹窗 */}
      <Modal
        title="创建增长实验"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item
            name="name"
            label="实验名称"
            rules={[{ required: true, message: '请输入实验名称' }]}
          >
            <Input placeholder="例如：注册流程优化" />
          </Form.Item>
          <Form.Item
            name="hypothesis"
            label="实验假设"
            rules={[{ required: true, message: '请输入实验假设' }]}
          >
            <TextArea rows={2} placeholder="例如：简化注册步骤可以提升注册转化率" />
          </Form.Item>
          <Form.Item
            name="variantA"
            label="变体A（对照组）"
            rules={[{ required: true, message: '请输入变体A描述' }]}
          >
            <Input placeholder="例如：当前3步注册流程" />
          </Form.Item>
          <Form.Item
            name="variantB"
            label="变体B（实验组）"
            rules={[{ required: true, message: '请输入变体B描述' }]}
          >
            <Input placeholder="例如：简化为1步注册（仅手机号）" />
          </Form.Item>
          <Form.Item
            name="metricName"
            label="测试指标"
            rules={[{ required: true, message: '请选择测试指标' }]}
          >
            <Select
              placeholder="选择要测试的指标"
              options={[
                { value: '注册转化率', label: '注册转化率' },
                { value: '付费转化率', label: '付费转化率' },
                { value: '按钮点击率', label: '按钮点击率' },
                { value: '留存率', label: '留存率' },
                { value: '退订率', label: '退订率' }
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建实验
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExperimentsPage;
