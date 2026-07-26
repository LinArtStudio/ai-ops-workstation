'use client';

import { usePathname } from 'next/navigation';
import { ProjectProvider } from '@/contexts/ProjectContext';
import MainLayout from '@/components/Layout/MainLayout';

const BARE_PATHS = ['/login', '/signup', '/invite', '/pricing'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBarePage = BARE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isBarePage) {
    return <>{children}</>;
  }

  return (
    <ProjectProvider>
      <MainLayout>{children}</MainLayout>
    </ProjectProvider>
  );
}
