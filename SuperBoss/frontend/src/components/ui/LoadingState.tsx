export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="surface-panel flex min-h-[240px] items-center justify-center rounded-[1.75rem] border-dashed text-sm text-slate-300">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#7ae7cf] shadow-[0_0_18px_rgba(122,231,207,0.8)]" />
        <span>{label}</span>
      </div>
    </div>
  );
}




