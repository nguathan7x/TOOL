import type { HTMLAttributes, ImgHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  imageClassName?: ImgHTMLAttributes<HTMLImageElement>['className'];
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base'
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, src, size = 'md', className, imageClassName, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/18 bg-[linear-gradient(135deg,#b8c4ff_0%,#76e8d6_55%,#182844_100%)] font-semibold text-[#07111f] shadow-[0_10px_24px_rgba(0,0,0,0.18)]',
        sizeClasses[size],
        className
      )}
      aria-label={name}
      title={name}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className={cn('h-full w-full object-cover', imageClassName)} />
      ) : (
        initials(name)
      )}
    </div>
  );
}
