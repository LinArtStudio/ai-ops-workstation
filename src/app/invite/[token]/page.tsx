'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Button, Card, Space, Spin, Typography, message } from 'antd';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { setStoredProjectId } from '@/lib/projects';

const { Title, Text } = Typography;

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) {
          setEmail(user?.email || null);
        }
      } catch {
        if (!cancelled) setEmail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextPath = token ? `/invite/${token}` : '/';

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const response = await fetch('/api/projects/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '接受邀请失败');
      }
      if (data.projectId) {
        setStoredProjectId(data.projectId);
      }
      message.success('已加入项目');
      router.replace('/feedback');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '接受邀请失败');
    } finally {
      setAccepting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setSwitching(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换账号失败');
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

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
      <Card style={{ width: 420, maxWidth: '100%' }}>
        <Title level={3} style={{ marginTop: 0 }}>
          接受项目邀请
        </Title>
        <Text type="secondary">加入后即可查看该项目的反馈与周报数据。</Text>

        {error ? (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ marginTop: 16 }}
          />
        ) : null}

        <div style={{ marginTop: 24 }}>
          {email ? (
            <>
              <Text>
                当前登录：<Text strong>{email}</Text>
              </Text>
              <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                <Button
                  type="primary"
                  block
                  loading={accepting}
                  onClick={() => void handleAccept()}
                >
                  接受邀请并加入
                </Button>
                <Button
                  block
                  loading={switching}
                  onClick={() => void handleSwitchAccount()}
                >
                  不是这个账号？退出并换号登录
                </Button>
              </Space>
            </>
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                message="请先登录受邀邮箱账号，再回到此链接接受邀请"
              />
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
                <Button type="primary" block style={{ marginTop: 16 }}>
                  去登录
                </Button>
              </Link>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>
                  没有账号？注册
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
