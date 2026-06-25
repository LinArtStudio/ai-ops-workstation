// 数据库类型定义

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: number;
  project_id: string;
  metric_name: 'dau' | 'retention' | 'conversion' | 'revenue';
  metric_value: number;
  dimension?: Record<string, string>;
  recorded_at: string;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  project_id: string;
  content: string;
  source: 'manual' | 'form' | 'api';
  category?: 'bug' | 'feature' | 'ux' | 'performance' | 'other';
  sentiment?: 'positive' | 'negative' | 'neutral';
  priority?: number;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved';
  tags?: string[];
  created_at: string;
}

export interface Competitor {
  id: string;
  project_id: string;
  name: string;
  url?: string;
  features?: Record<string, unknown>;
  pricing?: string;
  strengths?: string[];
  weaknesses?: string[];
  notes?: string;
  last_updated?: string;
  created_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  week_start: string;
  week_end: string;
  content?: string;
  metrics_summary?: Record<string, unknown>;
  ai_insights?: string[];
  created_at: string;
}

export interface Experiment {
  id: string;
  project_id: string;
  name: string;
  hypothesis?: string;
  variant_a?: string;
  variant_b?: string;
  metric_name?: string;
  result?: {
    a_value: number;
    b_value: number;
    lift: string;
    confidence: number;
  };
  status: 'draft' | 'running' | 'completed';
  created_at: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 指标摘要
export interface MetricsSummary {
  dau?: number;
  retention?: number;
  conversion?: number;
  revenue?: number;
  change?: {
    dau?: string;
    retention?: string;
    conversion?: string;
    revenue?: string;
  };
}
