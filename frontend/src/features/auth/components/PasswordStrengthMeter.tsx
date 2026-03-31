import { cn } from '../../../lib/cn';

type PasswordStrengthMeterProps = {
  password: string;
  theme?: 'light' | 'dark';
};

function evaluatePassword(password: string) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ];

  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      score: 0,
      label: 'Start typing to measure password strength',
      tone: 'neutral' as const
    };
  }

  if (score <= 2) {
    return {
      score,
      label: 'Weak password',
      tone: 'weak' as const
    };
  }

  if (score <= 4) {
    return {
      score,
      label: 'Good password',
      tone: 'good' as const
    };
  }

  return {
    score,
    label: 'Strong password',
    tone: 'strong' as const
  };
}

export function PasswordStrengthMeter({ password, theme = 'light' }: PasswordStrengthMeterProps) {
  const { score, label, tone } = evaluatePassword(password);
  const isDark = theme === 'dark';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((segmentIndex) => {
          const active = score > segmentIndex;

          return (
            <span
              key={segmentIndex}
              className={cn(
                'h-2 flex-1 rounded-full transition',
                !active && (isDark ? 'bg-white/10' : 'bg-slate-200'),
                active && tone === 'weak' && 'bg-rose-400',
                active && tone === 'good' && 'bg-amber-400',
                active && tone === 'strong' && 'bg-emerald-400'
              )}
            />
          );
        })}
      </div>
      <p className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-500')}>{label}</p>
    </div>
  );
}
