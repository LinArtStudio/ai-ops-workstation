// 竞品监控页面
'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Typography, message, Space, Tooltip, Row, Col, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, RobotOutlined, LinkOutlined, EditOutlined } from '@ant-design/icons';
import { generateCompetitorAnalysis } from '@/lib/ai';
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
  lastUpdated: string;
}

const CompetitorsPage: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      id: '1',
      name: '神策数据',
      url: 'https://www.sensorsdata.cn',
      pricing: '5万+/年',
      strengths: ['功能全面', '私有化部署成熟', '数据精度高'],
      weaknesses: ['价格高', '接入复杂', '学习曲线陡'],
      notes: '国内用户行为分析头部产品',
      lastUpdated: '2026-06-25'
    },
    {
      id: '2',
      name: 'GrowingIO',
      url: 'https://www.growingio.com',
      pricing: '不透明，需联系顾问',
      strengths: ['无埋点降低门槛', '操作体验好', '大客户背书'],
      weaknesses: ['价格不透明', '无免费版', '私有化成本高'],
      notes: '无埋点先驱，面向中大企业',
      lastUpdated: '2026-06-20'
    },
    {
      id: '3',
      name: 'Webfunny',
      url: 'https://www.webfunny.com',
      pricing: '社区版免费',
      strengths: ['开源免费', '监控+埋点一体化', '私有化简单'],
      weaknesses: ['分析深度不足', '品牌知名度低'],
      notes: '开源一体化监控工具',
      lastUpdated: '2026-06-18'
    },
    {
      id: '4',
      name: 'Microsoft Clarity',
      url: 'https://clarity.microsoft.com',
      pricing: '完全免费',
      strengths: ['完全免费', 'AI功能免费', '开箱即用'],
      weaknesses: ['不支持移动端App', '功能相对基础'],
      notes: '微软出品的免费行为分析工具',
      lastUpdated: '2026-06-15'
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [form] = Form.useForm();

  // 添加竞品
  const handleAdd = async (values: { name: string; url: string; pricing: string; notes: string }) => {
    try {
      const newCompetitor: Competitor = {
        id: Date.now().toString(),
        name: values.name,
        url: values.url,
        pricing: values.pricing,
        strengths: [],
        weaknesses: [],
        notes: values.notes,
        lastUpdated: new Date().toLocaleDateString()
      };

      setCompetitors(prev => [newCompetitor, ...prev]);
      setModalVisible(false);
      form.resetFields();
      message.success('竞品添加成功');
    } catch (error) {
      message.error('添加失败');
    }
  };

  // AI分析竞品
  const handleAiAnalyze = async (id: string) => {
    const competitor = competitors.find(c => c.id === id);
    if (!competitor) return;

    message.info('AI正在分析竞品...');
    
    try {
      // 构建竞品信息
      const competitorInfo = `
竞品名称：${competitor.name}
官网：${competitor.url}
定价：${competitor.pricing}
备注：${competitor.notes}
优势：${competitor.strengths.join('、')}
劣势：${competitor.weaknesses.join('、')}
      `;
      
      // 调用真实AI API分析
      const analysis = await generateCompetitorAnalysis(competitor.name, competitorInfo);
      
      // 更新竞品数据
      setCompetitors(prev => prev.map(c =>
        c.id === id
          ? { 
              ...c, 
              notes: analysis,
              lastUpdated: new Date().toLocaleDateString() 
            }
          : c
      ));
      
      message.success('AI分析完成！');
    } catch (error) {
      console.error('AI分析失败:', error);
      message.error('AI服务暂时不可用，请稍后重试');
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
      render: (pricing: string) => <Tag color="blue">{pricing}</Tag>
    },
    {
      title: '优势',
      dataIndex: 'strengths',
      key: 'strengths',
      render: (strengths: string[]) => (
        <div style={{ maxWidth: 200 }}>
          {strengths.slice(0, 2).map((s, i) => (
            <Tag key={i} color="green" style={{ marginBottom: 4 }}>{s}</Tag>
          ))}
          {strengths.length > 2 && <Tag>+{strengths.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '劣势',
      dataIndex: 'weaknesses',
      key: 'weaknesses',
      render: (weaknesses: string[]) => (
        <div style={{ maxWidth: 200 }}>
          {weaknesses.slice(0, 2).map((w, i) => (
            <Tag key={i} color="red" style={{ marginBottom: 4 }}>{w}</Tag>
          ))}
          {weaknesses.length > 2 && <Tag>+{weaknesses.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated'
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
            <Button type="link" icon={<RobotOutlined />} onClick={() => handleAiAnalyze(record.id)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} />
          </Tooltip>
        </Space>
      )
    }
  ];

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
                {competitors.filter(c => c.strengths.length > 0).length}
              </div>
              <div>已分析</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
                {competitors.filter(c => c.lastUpdated === new Date().toLocaleDateString()).length}
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
              <Descriptions.Item label="更新时间">{selectedCompetitor.lastUpdated}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedCompetitor.notes}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="✅ 优势" size="small">
                  {selectedCompetitor.strengths.length > 0 ? (
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
                  {selectedCompetitor.weaknesses.length > 0 ? (
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
              <Button type="primary" icon={<RobotOutlined />} onClick={() => {
                handleAiAnalyze(selectedCompetitor.id);
                setDetailModalVisible(false);
              }}>
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
