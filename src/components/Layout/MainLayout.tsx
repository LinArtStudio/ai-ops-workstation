// 主布局组件
'use client';

import React, { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  MessageOutlined,
  EyeOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  RobotOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/feedback',
      icon: <MessageOutlined />,
      label: '用户反馈',
    },
    {
      key: '/competitors',
      icon: <EyeOutlined />,
      label: '竞品监控',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'AI周报',
    },
    {
      key: '/experiments',
      icon: <ExperimentOutlined />,
      label: '增长实验',
    },
    {
      key: '/ai-assistant',
      icon: <RobotOutlined />,
      label: 'AI助手',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
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
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {!collapsed ? (
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
              🚀 AI运营工作台
            </h1>
          ) : (
            <span style={{ color: '#fff', fontSize: 24 }}>🚀</span>
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
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(item => item.key === pathname)?.label || 'AI产品运营工作台'}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar
              style={{ cursor: 'pointer', backgroundColor: '#1677ff' }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
          minHeight: 280
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
