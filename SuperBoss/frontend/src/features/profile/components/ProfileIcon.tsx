import type { SVGProps } from 'react';
import { cn } from '../../../lib/cn';

type IconName =
  | 'mail'
  | 'phone'
  | 'calendar'
  | 'user'
  | 'location'
  | 'spark'
  | 'briefcase'
  | 'workspace'
  | 'project'
  | 'team'
  | 'pulse'
  | 'shield'
  | 'activity';

type ProfileIconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const iconClassName = 'h-4 w-4';

export function ProfileIcon({ name, className, ...props }: ProfileIconProps) {
  const shared = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn(iconClassName, className)
  };

  switch (name) {
    case 'mail':
      return (
        <svg {...shared} {...props}>
          <path d="M4 6h16v12H4z" />
          <path d="M4 8l8 6 8-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared} {...props}>
          <path d="M8 4h8l1 2v12l-1 2H8l-1-2V6z" />
          <path d="M10 17h4" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared} {...props}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case 'user':
      return (
        <svg {...shared} {...props}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'location':
      return (
        <svg {...shared} {...props}>
          <path d="M12 21s6-4.5 6-10a6 6 0 1 0-12 0c0 5.5 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...shared} {...props}>
          <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
          <path d="m19 3 .7 1.8L21.5 5.5l-1.8.7L19 8l-.7-1.8-1.8-.7 1.8-.7Z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...shared} {...props}>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M9 7V5h6v2M3 12h18" />
        </svg>
      );
    case 'workspace':
      return (
        <svg {...shared} {...props}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M3 9h18M8 4v16" />
        </svg>
      );
    case 'project':
      return (
        <svg {...shared} {...props}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 8h8M8 12h5M8 16h7" />
        </svg>
      );
    case 'team':
      return (
        <svg {...shared} {...props}>
          <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M3 20a5 5 0 0 1 10 0M14 20a4 4 0 0 1 7 0" />
        </svg>
      );
    case 'pulse':
      return (
        <svg {...shared} {...props}>
          <path d="M3 12h4l2-4 4 8 2-4h6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared} {...props}>
          <path d="M12 3l7 3v5c0 4.3-2.6 7.7-7 10-4.4-2.3-7-5.7-7-10V6l7-3Z" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...shared} {...props}>
          <path d="M4 13h4l2-6 4 10 2-4h4" />
        </svg>
      );
    default:
      return null;
  }
}
