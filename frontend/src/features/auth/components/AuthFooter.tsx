import type { ReactNode } from 'react';

export function AuthFooter({ prompt, action }: { prompt: string; action: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] bg-[#f5f8f3] px-4 py-4 text-center text-sm text-slate-500">
      <span>{prompt} </span>
      <span className="font-semibold text-[#163d2c]">{action}</span>
    </div>
  );
}

