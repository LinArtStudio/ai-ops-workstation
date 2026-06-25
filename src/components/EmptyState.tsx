// 空状态组件
'use client';

import React from 'react';
import { Empty, Button, Typography } from 'antd';

const { Text } = Typography;

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
              {title}
            </Text>
            {description && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {description}
              </Text>
            )}
          </div>
        }
      >
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
