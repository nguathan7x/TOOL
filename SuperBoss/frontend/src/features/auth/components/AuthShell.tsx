import type { PropsWithChildren } from 'react';

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#eef3ee] px-4 py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-gradient-to-br from-ink via-brand-800 to-brand-600 p-10 text-white shadow-panel">
          <p className="text-sm uppercase tracking-[0.24em] text-white/60">Workspace narrative</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            Team delivery workspaces with controlled workflow and visible accountability.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/75">
            Sign in to explore a board shaped around planning, execution, review, QA, UAT, and done,
            with permissions that visibly change by role.
          </p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-panel">{children}</div>
      </div>
    </div>
  );
}

