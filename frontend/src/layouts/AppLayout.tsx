import type { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { WorkspaceDataProvider } from '../features/workspaces/store/WorkspaceDataContext';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <WorkspaceDataProvider>
      <div className="app-shell-cosmic flex min-h-screen text-white">
        <Sidebar />
        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,156,255,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(110,233,216,0.1),transparent_22%)]" />
          <Header />
          <main className="relative min-w-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
          <Footer />
        </div>
      </div>
    </WorkspaceDataProvider>
  );
}


