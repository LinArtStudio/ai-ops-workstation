// 用户反馈页面 - 已接入Supabase数据持久化
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Typography, message, Space, Tooltip, Spin } from 'antd';
import { PlusOutlined, FilterOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { analyzeFeedback } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
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
  created_at: string;
}

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form] = Form.useForm();

  // 从Supabase加载数据
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feedback_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('加载反馈失败:', error);
        message.error('加载数据失败');
        return;
      }

      setFeedbacks(data || []);
    } catch (err) {
      console.error('加载反馈异常:', err);
    } finally {
      setLoading(false);
    }
  };

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
      // 先添加到Supabase
      const { data, error } = await supabase
        .from('feedback_items')
        .insert({
          content: values.content,
          source: values.source,
          category: 'other',
          sentiment: 'neutral',
          priority: 3,
          status: 'new'
        })
        .select()
        .single();

      if (error) {
        console.error('添加反馈失败:', error);
        message.error('添加失败');
        return;
      }

      // 更新本地状态
      setFeedbacks(prev => [data, ...prev]);
      setModalVisible(false);
      form.resetFields();
      message.success('反馈添加成功，AI正在分析...');

      // 异步调用AI分析
      try {
        const analysis = await analyzeFeedback(values.content);
        
        // 更新Supabase中的AI分析结果
        const { error: updateError } = await supabase
          .from('feedback_items')
          .update({
            category: analysis.category,
            sentiment: analysis.sentiment,
            priority: analysis.priority
          })
          .eq('id', data.id);

        if (updateError) {
          console.error('更新AI分析结果失败:', updateError);
        }

        // 更新本地状态
        setFeedbacks(prev => prev.map(f => 
          f.id === data.id 
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

  // 更新反馈状态
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('更新状态失败:', error);
        message.error('更新失败');
        return;
      }

      setFeedbacks(prev => prev.map(f => 
        f.id === id ? { ...f, status: newStatus } : f
      ));
      message.success('状态更新成功');
    } catch (err) {
      console.error('更新状态异常:', err);
      message.error('更新失败');
    }
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
      render: (status: string, record: Feedback) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          style={{ width: 100 }}
          options={[
            { value: 'new', label: '新反馈' },
            { value: 'reviewed', label: '已审阅' },
            { value: 'in_progress', label: '处理中' },
            { value: 'resolved', label: '已解决' }
          ]}
        />
      )
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    }
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>💬 用户反馈中心</Title>
          <Text type="secondary">收集、分析、管理用户反馈（数据已持久化到Supabase）</Text>
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
          <Button icon={<ReloadOutlined />} onClick={fetchFeedbacks}>刷新</Button>
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">加载中...</Text>
            </div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
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
