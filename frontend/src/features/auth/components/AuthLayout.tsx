import type { PropsWithChildren, ReactNode } from 'react';
import { LogoMark } from './LogoMark';

const featureHighlights = [
  {
    title: 'Structured delivery flow',
    description: 'Move work from planning to done with explicit gates for review, QA, and UAT.'
  },
  {
    title: 'Role-aware collaboration',
    description: 'PMs, developers, QA, and clients each see the actions that match their responsibility.'
  },
  {
    title: 'Traceable execution',
    description: 'Assignments, comments, and status changes stay visible across the whole delivery lifecycle.'
  }
];

type AuthLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
}>;

export function AuthLayout({ eyebrow, title, description, badge, children }: AuthLayoutProps) {
  return (
    <div className="auth-galaxy-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="auth-stars-layer auth-stars-layer--near" />
      <div className="auth-stars-layer auth-stars-layer--far" />
      <div className="auth-nebula auth-nebula--left" />
      <div className="auth-nebula auth-nebula--right" />

      <div
        className="auth-page-stage mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(8,12,24,0.58)] shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl xl:rounded-[2.5rem] auth-fade-up"
        style={{ ['--delay' as string]: '20ms' }}
      >
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,12,24,0.82)_0%,rgba(10,18,32,0.74)_100%)] px-10 py-10 text-white lg:flex lg:w-[48%] lg:flex-col xl:px-14 xl:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(135,156,255,0.18),transparent_28%),radial-gradient(circle_at_70%_30%,rgba(138,236,217,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(104,77,255,0.18),transparent_26%)]" />
          <div className="absolute left-[8%] top-[10%] h-40 w-40 rounded-full bg-[#7c8dff]/12 blur-3xl auth-float-slow" />
          <div className="absolute bottom-[14%] right-[6%] h-52 w-52 rounded-full bg-[#6ef7dc]/10 blur-3xl auth-float-slow" />
          <div className="absolute right-[12%] top-[16%] h-24 w-24 rounded-full border border-white/10 bg-white/5 auth-float-delayed" />

          <div className="auth-orbit-grid absolute inset-0 opacity-70" />

          <div className="relative flex items-center justify-between gap-4 auth-fade-up" style={{ ['--delay' as string]: '70ms' }}>
            <div>
              <LogoMark />
              <h1 className="mt-6 max-w-md text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white xl:text-[3.45rem]">
                SuperBoss brings order to complex work in motion.
              </h1>
            </div>
            {badge ? <div className="hidden xl:block">{badge}</div> : null}
          </div>

          <div className="relative mt-8 max-w-xl auth-fade-up" style={{ ['--delay' as string]: '120ms' }}>
            <p className="text-sm uppercase tracking-[0.26em] text-[#b6c2ff]/70">{eyebrow}</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white xl:text-3xl">{title}</h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-slate-200/78">{description}</p>
          </div>

          <div className="relative mt-10 grid gap-4 xl:mt-14">
            {featureHighlights.map((highlight, index) => (
              <div
                key={highlight.title}
                className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm auth-fade-up"
                style={{ ['--delay' as string]: `${170 + index * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#8ae6d9] shadow-[0_0_18px_rgba(138,230,217,0.8)]" />
                  <p className="text-sm font-semibold tracking-[-0.01em] text-white">{highlight.title}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200/72">{highlight.description}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-auto flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200/76 auth-fade-up" style={{ ['--delay' as string]: '360ms' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-xs font-semibold text-white">PM</div>
            <p>Built for teams that need governed delivery, clean handoffs, and a polished operational system.</p>
          </div>
        </section>

        <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(6,10,20,0.56)_0%,rgba(10,16,28,0.5)_100%)] px-4 py-8 sm:px-8 lg:px-10 xl:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,141,255,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(110,247,220,0.09),transparent_24%)]" />
          <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-white/10 bg-white/5 auth-float-delayed" />
          <div className="absolute bottom-8 left-6 h-20 w-20 rounded-full bg-[#8ae6d9]/12 blur-2xl auth-float-slow" />
          <div className="absolute left-[12%] top-[22%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.9)] auth-twinkle" />
          <div className="absolute right-[18%] top-[34%] h-1 w-1 rounded-full bg-[#b6c2ff] shadow-[0_0_18px_rgba(182,194,255,0.95)] auth-twinkle-delayed" />
          <div className="absolute bottom-[18%] right-[22%] h-1.5 w-1.5 rounded-full bg-[#8ae6d9] shadow-[0_0_18px_rgba(138,230,217,0.95)] auth-twinkle" />
          <div className="w-full max-w-[34rem] auth-fade-up" style={{ ['--delay' as string]: '120ms' }}>{children}</div>
        </section>
      </div>
    </div>
  );
}

