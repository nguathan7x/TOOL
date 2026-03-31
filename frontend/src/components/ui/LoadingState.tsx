export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/6 text-sm text-slate-200 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      {label}
    </div>
  );
}




