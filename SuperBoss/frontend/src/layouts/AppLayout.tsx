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
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(127,151,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(122,231,207,0.08),transparent_20%)]" />
          <Header />
          <main className="relative min-w-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto flex h-full w-full max-w-[1680px] flex-col">{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </WorkspaceDataProvider>
  );
}


