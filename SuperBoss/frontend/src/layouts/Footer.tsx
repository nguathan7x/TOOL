import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

function SocialIcon({ kind, className = 'h-[18px] w-[18px]' }: { kind: 'github' | 'linkedin' | 'twitter'; className?: string }) {
  if (kind === 'github') return <FontAwesomeIcon icon={faGithub} className={className} />;
  if (kind === 'linkedin') return <FontAwesomeIcon icon={faLinkedin} className={className} />;
  return <FontAwesomeIcon icon={faTwitter} className={className} />;
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className='text-sm font-medium tracking-wide text-zinc-300'>{title}</p>
      <div className='mt-5 flex flex-col space-y-4'>{children}</div>
    </div>
  );
}

function FooterLink({ label, to, href }: { label: string; to?: string; href?: string }) {
  const className = 'text-xs text-zinc-500 transition-colors duration-200 hover:text-zinc-100';
  if (to) {
    return <Link to={to} className={className}>{label}</Link>;
  }
  return <a href={href} className={className}>{label}</a>;
}

export function Footer() {
  return (
    <footer className='border-t border-zinc-900 bg-zinc-950 px-8 py-20 lg:px-16'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid gap-12 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]'>
          <div className='flex flex-col'>
            <LogoMark className='w-fit' compact />
            <p className='mt-8 max-w-xs text-xs leading-relaxed text-zinc-500'>
              SuperBoss is a premium work management surface for governed delivery, creator ownership, and role-aware collaboration.
            </p>
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

        <div className='mt-24 flex flex-col items-center justify-between gap-6 border-t border-zinc-900 pt-8 sm:flex-row'>
          <p className='text-xs text-zinc-500'>&copy; 2026 SuperBoss. Crafted for premium workspace operations.</p>
          
          <div className='flex items-center gap-6 text-zinc-500'>
            <a href='#' className='transition-colors duration-200 hover:text-zinc-100' aria-label='Twitter'>
              <SocialIcon kind='twitter' />
            </a>
            <a href='#' className='transition-colors duration-200 hover:text-zinc-100' aria-label='GitHub'>
              <SocialIcon kind='github' />
            </a>
            <a href='#' className='transition-colors duration-200 hover:text-zinc-100' aria-label='LinkedIn'>
              <SocialIcon kind='linkedin' />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
