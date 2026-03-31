import { cn } from '../../../lib/cn';

type SocialAuthButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function SocialAuthButton({ label, onClick, disabled = false }: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#d8e3d7] bg-white px-4 text-sm font-semibold text-[#10241a] transition hover:border-emerald-200 hover:bg-[#fbfcfa] disabled:cursor-not-allowed disabled:opacity-60'
      )}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path fill="#EA4335" d="M12 10.2v3.9h5.42c-.23 1.25-.95 2.3-2.02 3.01l3.27 2.53c1.9-1.75 2.99-4.33 2.99-7.43 0-.71-.06-1.39-.18-2.01H12Z" />
          <path fill="#34A853" d="M6.56 14.28 5.82 14.85 3.21 16.89A9.96 9.96 0 0 0 12 22c2.7 0 4.96-.89 6.62-2.4l-3.27-2.53c-.9.61-2.06.97-3.35.97-2.6 0-4.81-1.75-5.6-4.1Z" />
          <path fill="#4A90E2" d="M3.21 7.11A9.96 9.96 0 0 0 3 12c0 1.76.42 3.42 1.18 4.89l3.38-2.61a5.98 5.98 0 0 1 0-4.56L4.18 7.11Z" />
          <path fill="#FBBC05" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.96 14.7 2 12 2 8.11 2 4.76 4.22 3.21 7.11l3.35 2.61c.79-2.36 3-4.1 5.44-4.1Z" />
        </svg>
      </span>
      <span>{label}</span>
    </button>
  );
}

