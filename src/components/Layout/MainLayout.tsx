'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  theme,
  Avatar,
  Dropdown,
  Spin,
  Typography,
  Select,
  Button,
  Modal,
  Input,
  Space,
  message,
  Tag,
} from 'antd';
import {
  DashboardOutlined,
  MessageOutlined,
  EyeOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  RobotOutlined,
  UserOutlined,
  BulbOutlined,
  LogoutOutlined,
  PlusOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import WeeklyLoopGuide from '@/components/WeeklyLoopGuide';
import type { QuotaStatus } from '@/lib/quota';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const {
    user,
    project,
    projects,
    loading,
    error,
    switchProject,
    addProject,
  } = useProject();
  const isOwner = !!(user && project && project.user_id === user.id);

  const refreshQuota = useCallback(async () => {
    if (!project?.id) {
      setQuota(null);
      return;
    }
    try {
      const res = await fetch(`/api/projects/quota?projectId=${project.id}`);
      const data = await res.json();
      if (res.ok) setQuota(data.quota);
    } catch {
      // ignore
    }
  }, [project?.id]);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota, pathname]);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
    { key: '/feedback', icon: <MessageOutlined />, label: '用户反馈' },
    { key: '/competitors', icon: <EyeOutlined />, label: '竞品监控' },
    { key: '/reports', icon: <FileTextOutlined />, label: 'AI周报' },
    { key: '/experiments', icon: <ExperimentOutlined />, label: '增长实验' },
    { key: '/insights', icon: <BulbOutlined />, label: '洞察→行动' },
    { key: '/ai-assistant', icon: <RobotOutlined />, label: 'AI助手' },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  const handleCreateProject = async () => {
    const name = newName.trim();
    if (!name) {
      message.warning('请输入项目名称');
      return;
    }
    setCreating(true);
    try {
      await addProject(name);
      message.success('项目已创建');
      setCreateOpen(false);
      setNewName('');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!project?.id) {
      message.warning('请先选择项目');
      return;
    }
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      message.warning('请输入有效邮箱');
      return;
    }
    setInviting(true);
    setInviteUrl('');
    try {
      const response = await fetch('/api/projects/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '邀请失败');
      }
      setInviteUrl(data.inviteUrl || '');
      message.success('邀请已创建，请复制链接发给对方');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '邀请失败');
    } finally {
      setInviting(false);
    }
  };

  const userMenuItems = [
    {
      key: 'email',
      label: user?.email || '未登录',
      disabled: true,
    },
    {
      key: 'pricing',
      label: '套餐与额度',
      onClick: () => {
        router.push('/pricing');
      },
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        void handleLogout();
      },
    },
  ];

  const handleMenuClick = (info: { key: string }) => {
    router.push(info.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!collapsed ? (
            <h1
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
              }}
            >
              AI运营工作台
            </h1>
          ) : (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
              AI
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout
        style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              {menuItems.find((item) => item.key === pathname)?.label ||
                'AI产品运营工作台'}
            </div>
            {loading ? (
              <Spin size="small" />
            ) : (
              <Space size={8}>
                <Select
                  style={{ minWidth: 160 }}
                  value={project?.id}
                  placeholder="选择项目"
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  onChange={(value) => switchProject(value)}
                />
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateOpen(true)}
                >
                  新建
                </Button>
                {isOwner ? (
                  <Button
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => {
                      setInviteOpen(true);
                      setInviteEmail('');
                      setInviteUrl('');
                    }}
                  >
                    邀请
                  </Button>
                ) : null}
                {quota ? (
                  <Tag
                    color={quota.remaining <= 5 ? 'red' : 'geekblue'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push('/pricing')}
                  >
                    {quota.plan.toUpperCase()} · AI {quota.used}/{quota.quota}
                  </Tag>
                ) : null}
              </Space>
            )}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar
              style={{ cursor: 'pointer', backgroundColor: '#1677ff' }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {error ? (
            <Text type="danger">
              {error}
              （若刚完成部署，请先在 Supabase 执行 M0 SQL 迁移）
            </Text>
          ) : null}
          <WeeklyLoopGuide />
          {children}
        </Content>
      </Layout>

      <Modal
        title="新建项目"
        open={createOpen}
        onOk={() => void handleCreateProject()}
        onCancel={() => {
          setCreateOpen(false);
          setNewName('');
        }}
        confirmLoading={creating}
        okText="创建"
      >
        <Input
          placeholder="例如：客户A / 产品主站"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={() => void handleCreateProject()}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          代运营可按客户各建一个项目，数据相互隔离。
        </Text>
      </Modal>

      <Modal
        title={`邀请成员${project ? ` · ${project.name}` : ''}`}
        open={inviteOpen}
        onOk={() => void handleInvite()}
        onCancel={() => {
          setInviteOpen(false);
          setInviteEmail('');
          setInviteUrl('');
        }}
        confirmLoading={inviting}
        okText="生成邀请链接"
      >
        <Input
          placeholder="成员邮箱"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onPressEnter={() => void handleInvite()}
        />
        {inviteUrl ? (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">邀请链接（复制发给对方）：</Text>
            <Input.TextArea
              value={inviteUrl}
              autoSize
              readOnly
              style={{ marginTop: 8 }}
              onFocus={(e) => e.target.select()}
            />
          </div>
        ) : null}
      </Modal>
    </Layout>
  );
};

export default MainLayout;
