import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AppShell from '@/components/Layout/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI产品运营工作台 - 用AI驱动产品增长',
  description:
    '一站式AI产品运营工具，集成数据看板、用户反馈、竞品监控、AI周报生成',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AntdRegistry>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </AntdRegistry>
      </body>
    </html>
  );
}
