'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  createProject,
  ensureDefaultProject,
  getStoredProjectId,
  listUserProjects,
  setStoredProjectId,
} from '@/lib/projects';
import { writeAuditLog } from '@/lib/audit';
import type { Project } from '@/types/database';

interface ProjectContextValue {
  user: User | null;
  project: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  switchProject: (projectId: string) => void;
  addProject: (name: string) => Promise<Project | null>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setProject(null);
        setProjects([]);
        return;
      }

      const preferredId = getStoredProjectId();
      const defaultProject = await ensureDefaultProject(
        supabase,
        currentUser.id,
        preferredId
      );
      const all = await listUserProjects(supabase, currentUser.id);
      setProjects(all);
      setProject(defaultProject);
      setStoredProjectId(defaultProject.id);
    } catch (err) {
      console.error('加载项目失败:', err);
      setError(err instanceof Error ? err.message : '加载项目失败');
      setProject(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchProject = useCallback(
    (projectId: string) => {
      const next = projects.find((p) => p.id === projectId);
      if (!next) return;
      setProject(next);
      setStoredProjectId(next.id);
    },
    [projects]
  );

  const addProject = useCallback(
    async (name: string) => {
      if (!user) return null;
      const supabase = createClient();
      const created = await createProject(supabase, user.id, { name });
      await writeAuditLog(supabase, {
        projectId: created.id,
        actorId: user.id,
        action: 'project.create',
        entityType: 'project',
        entityId: created.id,
        meta: { name },
      });
      setStoredProjectId(created.id);
      await refresh();
      return created;
    },
    [user, refresh]
  );

  useEffect(() => {
    void refresh();

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = createClient();
      const {
        data: { subscription: authSub },
      } = supabase.auth.onAuthStateChange(() => {
        void refresh();
      });
      subscription = authSub;
    } catch {
      // Missing env during local browse without config
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      project,
      projects,
      loading,
      error,
      refresh,
      switchProject,
      addProject,
    }),
    [user, project, projects, loading, error, refresh, switchProject, addProject]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return ctx;
}
