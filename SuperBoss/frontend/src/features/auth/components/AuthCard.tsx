import type { PropsWithChildren } from 'react';

export function AuthCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(16,36,26,0.08)] sm:px-8 sm:py-8 xl:px-10 xl:py-9 auth-scale-in" style={{ ['--delay' as string]: '170ms' }}>
      {children}
    </div>
  );
}

