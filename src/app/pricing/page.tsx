'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Col, Row, Typography, Tag, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '¥0',
    period: '/月',
    blurb: '个人试用与验证主流程',
    features: [
      '1 个项目',
      '反馈录入与基础列表',
      '每月 50 点 AI 额度',
      '周报 / 分析按额度扣减',
    ],
    cta: '免费开始',
    href: '/signup',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '¥149',
    period: '/人/月',
    blurb: '小团队日常运营闭环',
    features: [
      '多项目协作',
      '反馈 AI 分类 + 筛选',
      '每月 500 点 AI 额度',
      '周报自动汇总反馈',
      '优先人工开通支持',
    ],
    cta: '升级 Pro',
    href: '/signup',
    highlight: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '¥6,999',
    period: '/年',
    blurb: '代运营 / 多客户隔离',
    features: [
      '多项目与成员邀请',
      '每月 2000 点 AI 额度',
      '额度与用量可追踪',
      '飞书/钉钉集成（后续）',
      '专属开通与迁移协助',
    ],
    cta: '联系开通',
    href: '/signup',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fa',
        padding: '48px 24px 64px',
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Space style={{ marginBottom: 24 }}>
          <Link href="/login">登录</Link>
          <Text type="secondary">/</Text>
          <Link href="/signup">注册</Link>
        </Space>

        <Title level={2} style={{ marginBottom: 8 }}>
          套餐与 AI 额度
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 32, maxWidth: 640 }}>
          Phase A 采用「席位/团队年费 + AI credits」骨架：可先自助注册走 Free，
          Pro / Team 由管理员在数据库或环境变量中开通（暂无在线支付）。
        </Paragraph>

        <Row gutter={[16, 16]}>
          {PLANS.map((plan) => (
            <Col xs={24} md={8} key={plan.id}>
              <Card
                style={{
                  height: '100%',
                  borderColor: plan.highlight ? '#1677ff' : undefined,
                }}
              >
                <Space style={{ marginBottom: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {plan.name}
                  </Title>
                  {plan.highlight ? <Tag color="blue">推荐</Tag> : null}
                </Space>
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 32, fontWeight: 700 }}>
                    {plan.price}
                  </Text>
                  <Text type="secondary">{plan.period}</Text>
                </div>
                <Paragraph type="secondary">{plan.blurb}</Paragraph>
                <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ marginBottom: 8 }}>
                      <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button type={plan.highlight ? 'primary' : 'default'} block>
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ marginTop: 24 }}>
          <Title level={5}>如何手动升档（运营侧）</Title>
          <Paragraph style={{ marginBottom: 0 }}>
            推荐：在 Supabase <Text code>project_plans</Text> 将项目的{' '}
            <Text code>plan</Text> 设为 <Text code>pro</Text> /{' '}
            <Text code>team</Text>，并设置 <Text code>ai_quota_monthly</Text>
            （Pro=500，Team=2000）。也可在环境变量配置{' '}
            <Text code>PRO_PROJECT_IDS</Text> /{' '}
            <Text code>TEAM_PROJECT_IDS</Text>
            （逗号分隔项目 UUID）——环境变量会覆盖并写回数据库档位。
          </Paragraph>
        </Card>
      </div>
    </div>
  );
}
