// 用户反馈页面
'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Typography, message, Space, Tooltip } from 'antd';
import { PlusOutlined, FilterOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { analyzeFeedback } from '@/lib/ai';
import EmptyState from '@/components/EmptyState';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Feedback {
  id: string;
  content: string;
  source: string;
  category: string;
  sentiment: string;
  priority: number;
  status: string;
  createdAt: string;
}

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([
    {
      id: '1',
      content: '登录页面加载太慢了，经常要等5秒以上',
      source: 'manual',
      category: 'performance',
      sentiment: 'negative',
      priority: 4,
      status: 'new',
      createdAt: '2026-06-25 10:30'
    },
    {
      id: '2',
      content: '希望能增加数据导出功能，方便做报告',
      source: 'form',
      category: 'feature',
      sentiment: 'neutral',
      priority: 3,
      status: 'reviewed',
      createdAt: '2026-06-24 15:20'
    },
    {
      id: '3',
      content: '界面设计很漂亮，用起来很舒服',
      source: 'manual',
      category: 'ux',
      sentiment: 'positive',
      priority: 1,
      status: 'resolved',
      createdAt: '2026-06-23 09:15'
    },
    {
      id: '4',
      content: '提交反馈后没有收到确认邮件',
      source: 'api',
      category: 'bug',
      sentiment: 'negative',
      priority: 3,
      status: 'in_progress',
      createdAt: '2026-06-22 14:45'
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form] = Form.useForm();

  // 状态颜色映射
  const statusColorMap: Record<string, string> = {
    new: 'blue',
    reviewed: 'orange',
    in_progress: 'processing',
    resolved: 'success'
  };

  // 状态文本映射
  const statusTextMap: Record<string, string> = {
    new: '新反馈',
    reviewed: '已审阅',
    in_progress: '处理中',
    resolved: '已解决'
  };

  // 情感颜色映射
  const sentimentColorMap: Record<string, string> = {
    positive: 'green',
    negative: 'red',
    neutral: 'default'
  };

  // 分类颜色映射
  const categoryColorMap: Record<string, string> = {
    bug: 'red',
    feature: 'blue',
    ux: 'purple',
    performance: 'orange',
    other: 'default'
  };

  // 分类文本映射
  const categoryTextMap: Record<string, string> = {
    bug: 'Bug',
    feature: '功能建议',
    ux: '体验问题',
    performance: '性能问题',
    other: '其他'
  };

  // 添加反馈
  const handleAdd = async (values: { content: string; source: string }) => {
    try {
      // 先添加反馈，使用默认值
      const newFeedback: Feedback = {
        id: Date.now().toString(),
        content: values.content,
        source: values.source,
        category: 'other',
        sentiment: 'neutral',
        priority: 3,
        status: 'new',
        createdAt: new Date().toLocaleString()
      };

      setFeedbacks(prev => [newFeedback, ...prev]);
      setModalVisible(false);
      form.resetFields();
      message.success('反馈添加成功，AI正在分析...');

      // 异步调用AI分析
      try {
        const analysis = await analyzeFeedback(values.content);
        
        // 更新反馈的AI分析结果
        setFeedbacks(prev => prev.map(f => 
          f.id === newFeedback.id 
            ? { 
                ...f, 
                category: analysis.category,
                sentiment: analysis.sentiment,
                priority: analysis.priority
              }
            : f
        ));
        
        message.success('AI分析完成！');
      } catch (aiError) {
        console.error('AI分析失败:', aiError);
        message.warning('AI分析暂时不可用，已使用默认分类');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  // AI分析反馈
  const handleAiAnalyze = (id: string) => {
    message.info('AI正在分析反馈...');
    // 模拟AI分析
    setTimeout(() => {
      setFeedbacks(prev => prev.map(f =>
        f.id === id
          ? { ...f, category: 'feature', sentiment: 'neutral', priority: 3 }
          : f
      ));
      message.success('AI分析完成');
    }, 1000);
  };

  // 过滤反馈
  const filteredFeedbacks = filterStatus === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.status === filterStatus);

  // 表格列
  const columns = [
    {
      title: '反馈内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: '40%'
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        const sourceMap: Record<string, string> = {
          manual: '手动',
          form: '表单',
          api: 'API'
        };
        return <Tag>{sourceMap[source] || source}</Tag>;
      }
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={categoryColorMap[category]}>
          {categoryTextMap[category] || category}
        </Tag>
      )
    },
    {
      title: '情感',
      dataIndex: 'sentiment',
      key: 'sentiment',
      render: (sentiment: string) => {
        const sentimentMap: Record<string, string> = {
          positive: '😊 积极',
          negative: '😞 消极',
          neutral: '😐 中性'
        };
        return <Tag color={sentimentColorMap[sentiment]}>{sentimentMap[sentiment]}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority >= 4 ? 'red' : priority >= 3 ? 'orange' : 'green'}>
          P{priority}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status]}>{statusTextMap[status]}</Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Feedback) => (
        <Space>
          <Tooltip title="AI分析">
            <Button
              type="link"
              icon={<RobotOutlined />}
              onClick={() => handleAiAnalyze(record.id)}
            />
          </Tooltip>
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
          <Title level={4} style={{ margin: 0 }}>💬 用户反馈中心</Title>
          <Text type="secondary">收集、分析、管理用户反馈</Text>
        </div>
        <Space>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'new', label: '新反馈' },
              { value: 'reviewed', label: '已审阅' },
              { value: 'in_progress', label: '处理中' },
              { value: 'resolved', label: '已解决' }
            ]}
          />
          <Button icon={<ReloadOutlined />}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加反馈
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>{feedbacks.length}</div>
            <div>总反馈数</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
              {feedbacks.filter(f => f.status === 'resolved').length}
            </div>
            <div>已解决</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
              {feedbacks.filter(f => f.priority >= 4).length}
            </div>
            <div>高优先级</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>
              {feedbacks.filter(f => f.sentiment === 'negative').length}
            </div>
            <div>消极反馈</div>
          </div>
        </Card>
      </div>

      {/* 反馈列表 */}
      <Card>
        {filteredFeedbacks.length === 0 ? (
          <EmptyState
            title="暂无反馈"
            description="点击下方按钮添加第一条用户反馈"
            actionText="添加反馈"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredFeedbacks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 添加反馈弹窗 */}
      <Modal
        title="添加用户反馈"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item
            name="content"
            label="反馈内容"
            rules={[{ required: true, message: '请输入反馈内容' }]}
          >
            <TextArea rows={4} placeholder="请输入用户反馈内容..." />
          </Form.Item>
          <Form.Item
            name="source"
            label="反馈来源"
            initialValue="manual"
          >
            <Select
              options={[
                { value: 'manual', label: '手动录入' },
                { value: 'form', label: '用户表单' },
                { value: 'api', label: 'API接入' }
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加并AI分析
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

export default FeedbackPage;
