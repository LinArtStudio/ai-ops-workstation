'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Card, Form, Input, Typography, message, Spin } from 'antd';
import { createClient } from '@/lib/supabase/client';
import { ensureDefaultProject } from '@/lib/projects';
import { safeNextPath } from '@/lib/safe-url';

const { Title, Text } = Typography;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignup = async (values: {
    email: string;
    password: string;
    confirm: string;
  }) => {
    setLoading(true);
    setFormError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      if (data.user) {
        try {
          await ensureDefaultProject(supabase, data.user.id);
        } catch (projectError) {
          console.warn('默认项目创建稍后重试:', projectError);
        }
      }

      const next = safeNextPath(searchParams.get('next'));

      if (data.session) {
        message.success('注册成功');
        router.replace(next);
        router.refresh();
        return;
      }

      message.success('注册成功，请查收邮箱完成验证后再登录');
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 400, maxWidth: '100%' }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
        注册
      </Title>
      <Text type="secondary">创建账号后将自动生成默认项目</Text>

      {formError ? (
        <Alert
          type="error"
          showIcon
          message={formError}
          style={{ marginTop: 16, marginBottom: 8 }}
        />
      ) : null}

      <Form
        layout="vertical"
        onFinish={handleSignup}
        style={{ marginTop: 24 }}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input placeholder="you@example.com" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少 6 位' },
          ]}
        >
          <Input.Password placeholder="至少 6 位" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="确认密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="再次输入密码" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          注册
        </Button>
      </Form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary">
          已有账号？ <Link href="/login">登录</Link>
        </Text>
      </div>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 24,
      }}
    >
      <Suspense fallback={<Spin size="large" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
