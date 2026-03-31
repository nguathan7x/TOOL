export function Divider({ label = 'or continue with' }: { label?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-[#dfe7dd]" />
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-[#dfe7dd]" />
    </div>
  );
}

