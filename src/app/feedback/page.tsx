'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  message,
  Space,
  Spin,
  Alert,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
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
  project_id?: string;
}

const FeedbackPage: React.FC = () => {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [form] = Form.useForm();

  const fetchFeedbacks = useCallback(async () => {
    if (!project) {
      setFeedbacks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('feedback_items')
        .select('*')
        .eq('project_id', project.id)
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
  }, [project]);

  useEffect(() => {
    void fetchFeedbacks();
  }, [fetchFeedbacks]);

  const sentimentColorMap: Record<string, string> = {
    positive: 'green',
    negative: 'red',
    neutral: 'default',
  };

  const categoryColorMap: Record<string, string> = {
    bug: 'red',
    feature: 'blue',
    ux: 'purple',
    performance: 'orange',
    other: 'default',
  };

  const categoryTextMap: Record<string, string> = {
    bug: 'Bug',
    feature: '功能建议',
    ux: '体验问题',
    performance: '性能问题',
    other: '其他',
  };

  const handleAdd = async (values: { content: string; source: string }) => {
    if (!project) {
      message.error('项目未就绪，请刷新页面');
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('feedback_items')
        .insert({
          project_id: project.id,
          content: values.content,
          source: values.source,
          category: 'other',
          sentiment: 'neutral',
          priority: 3,
          status: 'new',
        })
        .select()
        .single();

      if (error) {
        console.error('添加反馈失败:', error);
        message.error('添加失败');
        return;
      }

      setFeedbacks((prev) => [data, ...prev]);
      setModalVisible(false);
      form.resetFields();
      message.success('反馈添加成功，AI正在分析...');

      try {
        const response = await fetch('/api/feedback/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: values.content,
            projectId: project.id,
            feedbackId: data.id,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '分析请求失败');
        }

        const analysis = payload.result;
        setFeedbacks((prev) =>
          prev.map((f) =>
            f.id === data.id
              ? {
                  ...f,
                  category: analysis.category,
                  sentiment: analysis.sentiment,
                  priority: analysis.priority,
                }
              : f
          )
        );

        message.success(
          payload.persisted ? 'AI分析完成并已保存' : 'AI分析完成'
        );
      } catch (aiError) {
        console.error('AI分析失败:', aiError);
        message.warning(
          aiError instanceof Error
            ? aiError.message
            : 'AI分析暂时不可用，已使用默认分类'
        );
      }
    } catch {
      message.error('添加失败');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!project) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('feedback_items')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('project_id', project.id);

      if (error) {
        console.error('更新状态失败:', error);
        message.error('更新失败');
        return;
      }

      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      );
      message.success('状态更新成功');
    } catch (err) {
      console.error('更新状态异常:', err);
      message.error('更新失败');
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterSentiment !== 'all' && f.sentiment !== filterSentiment) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      title: '反馈内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: '40%',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        const sourceMap: Record<string, string> = {
          manual: '手动',
          form: '表单',
          api: 'API',
        };
        return <Tag>{sourceMap[source] || source}</Tag>;
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={categoryColorMap[category]}>
          {categoryTextMap[category] || category}
        </Tag>
      ),
    },
    {
      title: '情感',
      dataIndex: 'sentiment',
      key: 'sentiment',
      render: (sentiment: string) => {
        const sentimentMap: Record<string, string> = {
          positive: '积极',
          negative: '消极',
          neutral: '中性',
        };
        return (
          <Tag color={sentimentColorMap[sentiment]}>
            {sentimentMap[sentiment]}
          </Tag>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority >= 4 ? 'red' : priority >= 3 ? 'orange' : 'green'}>
          P{priority}
        </Tag>
      ),
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
            { value: 'resolved', label: '已解决' },
          ]}
        />
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

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
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            用户反馈中心
          </Title>
          <Text type="secondary">
            收集、分析、管理用户反馈（按项目隔离，需登录）
          </Text>
        </div>
        <Space wrap>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'new', label: '新反馈' },
              { value: 'reviewed', label: '已审阅' },
              { value: 'in_progress', label: '处理中' },
              { value: 'resolved', label: '已解决' },
            ]}
          />
          <Select
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: 130 }}
            options={[
              { value: 'all', label: '全部分类' },
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: '功能建议' },
              { value: 'ux', label: '体验问题' },
              { value: 'performance', label: '性能问题' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Select
            value={filterSentiment}
            onChange={setFilterSentiment}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部情感' },
              { value: 'positive', label: '积极' },
              { value: 'neutral', label: '中性' },
              { value: 'negative', label: '消极' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void fetchFeedbacks()}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            disabled={!project}
          >
            添加反馈
          </Button>
        </Space>
      </div>

      {projectError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={projectError}
        />
      ) : null}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
              {feedbacks.length}
            </div>
            <div>总反馈数</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
              {feedbacks.filter((f) => f.status === 'resolved').length}
            </div>
            <div>已解决</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
              {feedbacks.filter((f) => f.priority >= 4).length}
            </div>
            <div>高优先级</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>
              {feedbacks.filter((f) => f.sentiment === 'negative').length}
            </div>
            <div>消极反馈</div>
          </div>
        </Card>
      </div>

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
          <Form.Item name="source" label="反馈来源" initialValue="manual">
            <Select
              options={[
                { value: 'manual', label: '手动录入' },
                { value: 'form', label: '用户表单' },
                { value: 'api', label: 'API接入' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加并AI分析
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedbackPage;
