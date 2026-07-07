import type { HTMLAttributes } from 'react';

const iconClass = 'h-5 w-5';

export const CheckIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M20 7 10 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const CheckCircleIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>
);

export const RateIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M7 7h10M7 12h7M7 17h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    <path d="m16 15 3 3 3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const ShieldIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M12 3 5 6v6c0 4.5 2.8 7.7 7 9 4.2-1.3 7-4.5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.9" />
    <path d="m9.5 12 1.7 1.7 3.3-3.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const SupportIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M6 11a6 6 0 1 1 12 0v4a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
    <rect x="4" y="11" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.9" />
    <rect x="16" y="11" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.9" />
    <path d="M12 19h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
  </svg>
);

export const FlashIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const ClockIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.9" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const UsersIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M16.5 19a4.5 4.5 0 0 0-9 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.9" />
    <path d="M19 18a3.5 3.5 0 0 0-2.5-3.4M18 7.5A2.5 2.5 0 0 1 18 12.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
  </svg>
);

export const CoinsIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <ellipse cx="10" cy="7" rx="5.5" ry="3" stroke="currentColor" strokeWidth="1.9" />
    <path d="M4.5 7v6c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3V7" stroke="currentColor" strokeWidth="1.9" />
    <path d="M14.5 11.5c.7-.3 1.6-.5 2.5-.5 2.5 0 4.5 1.1 4.5 2.5S19.5 16 17 16c-.9 0-1.8-.2-2.5-.5" stroke="currentColor" strokeWidth="1.9" />
  </svg>
);

export const SwapIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M7 16V4m0 0L4 7m3-3 3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
    <path d="M17 8v12m0 0 3-3m-3 3-3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const ArrowDownIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M12 5v14m0 0 6-6m-6 6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const ArrowRightIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
  </svg>
);

export const MenuIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
  </svg>
);

export const CloseIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
  </svg>
);

export const TelegramIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const PaperclipIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

export const FileIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path d="M14 3v5h5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

export const LockIcon = (props: HTMLAttributes<SVGSVGElement>) => (
  <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.9" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

export const CardBadge = ({ className = '', label }: { className?: string; label: string }) => (
  <div
    className={[
      'rounded-2xl border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink shadow-sm',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {label}
  </div>
);
