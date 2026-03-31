import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../features/auth/components/LogoMark';

const productLinks = [
  { label: 'Delivery board', to: '/projects' },
  { label: 'Workspace control', to: '/admin' },
  { label: 'Signals center', to: '/notifications' }
];

const companyLinks = [
  { label: 'About platform', to: '/dashboard' },
  { label: 'Workspace culture', to: '/profile' },
  { label: 'Careers', href: '#' }
];

const supportLinks = [
  { label: 'Help center', href: '#' },
  { label: 'Contact support', href: '#' },
  { label: 'System status', href: '#' }
];

const legalLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Security', href: '#' }
];

function SocialIcon({ kind, className = 'h-4 w-4' }: { kind: 'github' | 'linkedin' | 'twitter'; className?: string }) {
  if (kind === 'github') {
    return (
      <svg viewBox='0 0 24 24' fill='currentColor' className={className}>
        <path d='M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.06 1.82 2.79 1.29 3.47.99.11-.77.42-1.29.76-1.59-2.67-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.55.12-3.22 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.67.24 2.92.12 3.22.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z'/>
      </svg>
    );
  }
  if (kind === 'linkedin') {
    return (
      <svg viewBox='0 0 24 24' fill='currentColor' className={className}>
        <path d='M4.98 3.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM3.5 8.75h2.96V20.5H3.5V8.75Zm6 0h2.83v1.6h.04c.4-.75 1.37-1.83 2.83-1.83 3.03 0 3.59 2 3.59 4.6v7.38h-2.96v-6.54c0-1.56-.03-3.56-2.17-3.56-2.17 0-2.5 1.69-2.5 3.44v6.66H9.5V8.75Z'/>
      </svg>
    );
  }
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' className={className}>
      <path d='M22 5.92c-.74.33-1.53.55-2.36.65a4.11 4.11 0 0 0 1.8-2.27 8.23 8.23 0 0 1-2.6 1 4.1 4.1 0 0 0-6.98 3.73A11.64 11.64 0 0 1 3.4 4.9a4.1 4.1 0 0 0 1.27 5.47 4.05 4.05 0 0 1-1.85-.51v.05a4.1 4.1 0 0 0 3.29 4.02 4.13 4.13 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.85A8.24 8.24 0 0 1 2 18.57a11.62 11.62 0 0 0 6.29 1.84c7.55 0 11.68-6.25 11.68-11.67l-.01-.53A8.33 8.33 0 0 0 22 5.92Z'/>
    </svg>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className='text-xs uppercase tracking-[0.2em] text-[#b8c4ff]'>{title}</p>
      <div className='mt-4 space-y-3 text-sm text-slate-300'>{children}</div>
    </div>
  );
}

function FooterLink({ label, to, href }: { label: string; to?: string; href?: string }) {
  const className = 'inline-flex text-sm text-slate-300 transition hover:text-white';
  if (to) {
    return <Link to={to} className={className}>{label}</Link>;
  }
  return <a href={href} className={className}>{label}</a>;
}

export function Footer() {
  return (
    <footer className='border-t border-white/10 bg-[linear-gradient(180deg,rgba(7,11,22,0.78)_0%,rgba(6,9,18,0.96)_100%)] px-4 py-10 sm:px-6 lg:px-8'>
      <div className='rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(143,156,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(110,233,216,0.1),transparent_22%),linear-gradient(180deg,rgba(12,18,32,0.84)_0%,rgba(8,12,24,0.94)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-8'>
        <div className='grid gap-10 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]'>
          <div>
            <LogoMark className='w-fit bg-white/[0.06]' compact />
            <p className='mt-5 max-w-sm text-sm leading-7 text-slate-300'>
              SuperBoss is a premium work management surface for governed delivery, creator ownership, and role-aware collaboration inside modern project operations.
            </p>
            <div className='mt-6 flex items-center gap-3 text-slate-300'>
              <a href='#' className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] transition hover:bg-white/[0.1] hover:text-white'><SocialIcon kind='github' /></a>
              <a href='#' className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] transition hover:bg-white/[0.1] hover:text-white'><SocialIcon kind='linkedin' /></a>
              <a href='#' className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] transition hover:bg-white/[0.1] hover:text-white'><SocialIcon kind='twitter' /></a>
            </div>
          </div>

          <FooterColumn title='Product'>
            {productLinks.map((link) => <FooterLink key={link.label} {...link} />)}
          </FooterColumn>

          <FooterColumn title='Company'>
            {companyLinks.map((link) => <FooterLink key={link.label} {...link} />)}
          </FooterColumn>

          <FooterColumn title='Support'>
            {supportLinks.map((link) => <FooterLink key={link.label} {...link} />)}
          </FooterColumn>

          <FooterColumn title='Legal'>
            {legalLinks.map((link) => <FooterLink key={link.label} {...link} />)}
          </FooterColumn>
        </div>

        <div className='mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between'>
          <p>&copy; 2026 SuperBoss. Crafted for premium workspace operations.</p>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-300'>v1.0.0</span>
            <span>Constellation OS / governed delivery / creator ownership</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
