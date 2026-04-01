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
        'rounded-[1.75rem] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.22)]',
        isLight
          ? 'border border-[#dfe6de] bg-white text-[#10241a]'
          : 'surface-panel border-dashed text-white'
      )}
    >
      <h3 className={cn('text-lg font-semibold tracking-[-0.02em]', isLight ? 'text-[#10241a]' : 'text-white')}>{title}</h3>
      <p className={cn('mx-auto mt-2 max-w-lg text-sm leading-6', isLight ? 'text-slate-500' : 'text-slate-300')}>{description}</p>
    </div>
  );
}
