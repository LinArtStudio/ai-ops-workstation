// Supabase客户端配置
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 检查环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase环境变量未配置，部分功能可能无法使用');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库操作封装
export const db = {
  // 项目操作
  projects: {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(project: { user_id: string; name: string; description?: string; url?: string }) {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<{ name: string; description: string; url: string }>) {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // 指标操作
  metrics: {
    async list(projectId: string, metricName?: string, limit = 30) {
      let query = supabase
        .from('metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async insert(metrics: Array<{
      project_id: string;
      metric_name: string;
      metric_value: number;
      dimension?: Record<string, string>;
      recorded_at: string;
    }>) {
      const { data, error } = await supabase
        .from('metrics')
        .insert(metrics)
        .select();
      
      if (error) throw error;
      return data;
    },

    async getSummary(projectId: string) {
      // 获取最近7天的指标摘要
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('metrics')
        .select('metric_name, metric_value, recorded_at')
        .eq('project_id', projectId)
        .gte('recorded_at', sevenDaysAgo.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // 计算各指标最新值和变化
      const summary: Record<string, { current: number; previous: number; change: string }> = {};
      
      data?.forEach(item => {
        if (!summary[item.metric_name]) {
          summary[item.metric_name] = { current: item.metric_value, previous: 0, change: '0%' };
        }
      });

      return summary;
    }
  },

  // 反馈操作
  feedback: {
    async list(projectId: string, status?: string) {
      let query = supabase
        .from('feedback_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async create(feedback: {
      project_id: string;
      content: string;
      source?: string;
      category?: string;
      sentiment?: string;
      priority?: number;
    }) {
      const { data, error } = await supabase
        .from('feedback_items')
        .insert({ ...feedback, status: 'new' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<{
      status: string;
      category: string;
      sentiment: string;
      priority: number;
      tags: string[];
    }>) {
      const { data, error } = await supabase
        .from('feedback_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // 竞品操作
  competitors: {
    async list(projectId: string) {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(competitor: {
      project_id: string;
      name: string;
      url?: string;
      pricing?: string;
      notes?: string;
    }) {
      const { data, error } = await supabase
        .from('competitors')
        .insert(competitor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<{
      name: string;
      url: string;
      pricing: string;
      features: Record<string, unknown>;
      strengths: string[];
      weaknesses: string[];
      notes: string;
    }>) {
      const { data, error } = await supabase
        .from('competitors')
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // 周报操作
  reports: {
    async list(projectId: string) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .order('week_start', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(report: {
      project_id: string;
      week_start: string;
      week_end: string;
      content?: string;
      metrics_summary?: Record<string, unknown>;
      ai_insights?: string[];
    }) {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};
