'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Space, Steps, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';

const { Text } = Typography;

const DISMISS_KEY = 'aos_weekly_loop_guide_dismissed';

export default function WeeklyLoopGuide() {
  const router = useRouter();
  const { project } = useProject();
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!project?.id) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ count: fb }, { count: rp }] = await Promise.all([
        supabase
          .from('feedback_items')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id),
      ]);
      if (!cancelled) {
        setFeedbackCount(fb || 0);
        setReportCount(rp || 0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  if (dismissed) return null;

  const current =
    feedbackCount === 0 ? 0 : reportCount === 0 ? 1 : 2;

  return (
    <Alert
      type="success"
      showIcon
      style={{ marginBottom: 16 }}
      message="运营周闭环 · 3 步上手"
      description={
        <div>
          <Steps
            size="small"
            current={current}
            style={{ marginTop: 8, marginBottom: 12 }}
            items={[
              { title: '录入反馈', description: feedbackCount ? `${feedbackCount} 条` : '去添加' },
              { title: '生成周报', description: reportCount ? `${reportCount} 份` : '一键生成' },
              { title: '洞察→行动', description: '产出任务/PRD' },
            ]}
          />
          <Space wrap>
            <Button size="small" type={current === 0 ? 'primary' : 'default'} onClick={() => router.push('/feedback')}>
              1. 用户反馈
            </Button>
            <Button size="small" type={current === 1 ? 'primary' : 'default'} onClick={() => router.push('/reports')}>
              2. AI 周报
            </Button>
            <Button size="small" type={current === 2 ? 'primary' : 'default'} onClick={() => router.push('/insights')}>
              3. 洞察→行动
            </Button>
            <Button
              size="small"
              type="link"
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, '1');
                setDismissed(true);
              }}
            >
              不再显示
            </Button>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              Free 每月 50 点 AI；Pro 500；Team 2000。周报约 3 点、洞察约 2
              点、单次分析约 1 点。详见{' '}
              <a href="/pricing">套餐页</a>。
            </Text>
          </div>
        </div>
      }
    />
  );
}
