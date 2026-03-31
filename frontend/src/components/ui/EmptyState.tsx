import { cn } from '../../lib/cn';

export function EmptyState({
  title,
  description,
  theme = 'dark'
}: {
  title: string;
  description: string;
  theme?: 'dark' | 'light';
}) {
  const isLight = theme === 'light';

  return (
    <div
      className={cn(
        'rounded-3xl p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.2)]',
        isLight
          ? 'border border-[#dfe6de] bg-white text-[#10241a]'
          : 'border border-dashed border-white/10 bg-white/6 text-white backdrop-blur-xl'
      )}
    >
      <h3 className={cn('text-lg font-semibold', isLight ? 'text-[#10241a]' : 'text-white')}>{title}</h3>
      <p className={cn('mt-2 text-sm', isLight ? 'text-slate-500' : 'text-slate-200')}>{description}</p>
    </div>
  );
}
