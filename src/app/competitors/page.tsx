// 竞品监控页面 - 已接入Supabase数据持久化
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Typography, message, Space, Tooltip, Row, Col, Descriptions, Spin } from 'antd';
import { PlusOutlined, EyeOutlined, RobotOutlined, LinkOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import EmptyState from '@/components/EmptyState';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Competitor {
  id: string;
  name: string;
  url: string;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
  notes: string;
  last_updated: string;
  created_at: string;
}

const CompetitorsPage: React.FC = () => {
  const { project } = useProject();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    void fetchCompetitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const fetchCompetitors = async () => {
    if (!project) {
      setCompetitors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('加载竞品失败:', error);
        message.error('加载数据失败');
        return;
      }

      setCompetitors(data || []);
    } catch (err) {
      console.error('加载竞品异常:', err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加竞品
  const handleAdd = async (values: { name: string; url: string; pricing: string; notes: string }) => {
    if (!project) {
      message.error('项目未就绪');
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('competitors')
        .insert({
          project_id: project.id,
          name: values.name,
          url: values.url,
          pricing: values.pricing,
          notes: values.notes,
          strengths: [],
          weaknesses: [],
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('添加竞品失败:', error);
        message.error('添加失败');
        return;
      }

      setCompetitors(prev => [data, ...prev]);
      setModalVisible(false);
      form.resetFields();
      message.success('竞品添加成功');
    } catch (err) {
      console.error('添加竞品异常:', err);
      message.error('添加失败');
    }
  };

  // 删除竞品
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个竞品吗？',
      onOk: async () => {
        if (!project) return;
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from('competitors')
            .delete()
            .eq('id', id)
            .eq('project_id', project.id);

          if (error) {
            console.error('删除竞品失败:', error);
            message.error('删除失败');
            return;
          }

          setCompetitors(prev => prev.filter(c => c.id !== id));
          message.success('删除成功');
        } catch (err) {
          console.error('删除竞品异常:', err);
          message.error('删除失败');
        }
      }
    });
  };

  // AI分析竞品
  const handleAiAnalyze = async (id: string) => {
    const competitor = competitors.find(c => c.id === id);
    if (!competitor) return;

    setAnalyzing(id);
    try {
      // 构建竞品信息
      const competitorInfo = `
竞品名称：${competitor.name}
官网：${competitor.url}
定价：${competitor.pricing}
备注：${competitor.notes}
优势：${(competitor.strengths || []).join('、') || '暂无'}
劣势：${(competitor.weaknesses || []).join('、') || '暂无'}
      `;
      
      const response = await fetch('/api/ai/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorName: competitor.name,
          competitorInfo,
          projectId: project?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('分析请求失败');
      }

      const { analysis } = await response.json();

      if (!project) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('competitors')
        .update({
          notes: analysis,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .eq('project_id', project.id);

      if (error) {
        console.error('更新竞品失败:', error);
      }

      // 更新本地状态
      setCompetitors(prev => prev.map(c =>
        c.id === id
          ? { 
              ...c, 
              notes: analysis,
              last_updated: new Date().toISOString()
            }
          : c
      ));
      
      message.success('AI分析完成！');
    } catch (error) {
      console.error('AI分析失败:', error);
      message.error('AI服务暂时不可用，请稍后重试');
    } finally {
      setAnalyzing(null);
    }
  };

  // 查看详情
  const handleViewDetail = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setDetailModalVisible(true);
  };

  // 表格列
  const columns = [
    {
      title: '竞品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Competitor) => (
        <Space>
          <Text strong>{name}</Text>
          {record.url && (
            <Tooltip title="访问官网">
              <a href={record.url} target="_blank" rel="noopener noreferrer">
                <LinkOutlined style={{ color: '#1677ff' }} />
              </a>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '定价',
      dataIndex: 'pricing',
      key: 'pricing',
      render: (pricing: string) => <Tag color="blue">{pricing || '未知'}</Tag>
    },
    {
      title: '优势',
      dataIndex: 'strengths',
      key: 'strengths',
      render: (strengths: string[]) => (
        <div style={{ maxWidth: 200 }}>
          {(strengths || []).slice(0, 2).map((s, i) => (
            <Tag key={i} color="green" style={{ marginBottom: 4 }}>{s}</Tag>
          ))}
          {(strengths || []).length > 2 && <Tag>+{strengths.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '劣势',
      dataIndex: 'weaknesses',
      key: 'weaknesses',
      render: (weaknesses: string[]) => (
        <div style={{ maxWidth: 200 }}>
          {(weaknesses || []).slice(0, 2).map((w, i) => (
            <Tag key={i} color="red" style={{ marginBottom: 4 }}>{w}</Tag>
          ))}
          {(weaknesses || []).length > 2 && <Tag>+{weaknesses.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Competitor) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="AI分析">
            <Button 
              type="link" 
              icon={<RobotOutlined />} 
              onClick={() => handleAiAnalyze(record.id)}
              loading={analyzing === record.id}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="link" 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
              danger
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🔍 竞品监控</Title>
          <Text type="secondary">追踪竞品动态，获取AI分析洞察</Text>
        </div>
        <Space>
          <Button icon={<RobotOutlined />}>AI竞品报告</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加竞品
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>{competitors.length}</div>
              <div>监控竞品数</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                {competitors.filter(c => (c.strengths || []).length > 0).length}
              </div>
              <div>已分析</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
                {competitors.filter(c => {
                  const today = new Date().toDateString();
                  return c.last_updated && new Date(c.last_updated).toDateString() === today;
                }).length}
              </div>
              <div>今日更新</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 竞品列表 */}
      <Card>
        {competitors.length === 0 ? (
          <EmptyState
            title="暂无竞品"
            description="点击下方按钮添加第一个竞品"
            actionText="添加竞品"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={competitors}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 添加竞品弹窗 */}
      <Modal
        title="添加竞品"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item
            name="name"
            label="竞品名称"
            rules={[{ required: true, message: '请输入竞品名称' }]}
          >
            <Input placeholder="例如：神策数据" />
          </Form.Item>
          <Form.Item
            name="url"
            label="官网地址"
          >
            <Input placeholder="https://www.example.com" />
          </Form.Item>
          <Form.Item
            name="pricing"
            label="定价信息"
          >
            <Input placeholder="例如：5万+/年" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="竞品特点、关注点等..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 竞品详情弹窗 */}
      <Modal
        title={`竞品详情 - ${selectedCompetitor?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCompetitor && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="竞品名称">{selectedCompetitor.name}</Descriptions.Item>
              <Descriptions.Item label="官网">
                <a href={selectedCompetitor.url} target="_blank" rel="noopener noreferrer">
                  {selectedCompetitor.url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="定价">{selectedCompetitor.pricing}</Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {selectedCompetitor.last_updated ? new Date(selectedCompetitor.last_updated).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedCompetitor.notes}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="✅ 优势" size="small">
                  {(selectedCompetitor.strengths || []).length > 0 ? (
                    selectedCompetitor.strengths.map((s, i) => (
                      <Tag key={i} color="green" style={{ marginBottom: 8 }}>{s}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">暂无数据，点击AI分析获取</Text>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="❌ 劣势" size="small">
                  {(selectedCompetitor.weaknesses || []).length > 0 ? (
                    selectedCompetitor.weaknesses.map((w, i) => (
                      <Tag key={i} color="red" style={{ marginBottom: 8 }}>{w}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">暂无数据，点击AI分析获取</Text>
                  )}
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button 
                type="primary" 
                icon={<RobotOutlined />} 
                loading={analyzing === selectedCompetitor.id}
                onClick={() => {
                  handleAiAnalyze(selectedCompetitor.id);
                  setDetailModalVisible(false);
                }}
              >
                AI分析竞品
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompetitorsPage;
