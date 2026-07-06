import type { HTMLAttributes, PropsWithChildren } from 'react';

type CardTone = 'default' | 'soft' | 'dark' | 'brand';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  tone?: CardTone;
  bordered?: boolean;
}

const toneClasses: Record<CardTone, string> = {
  default: 'border border-line/70 bg-white text-ink shadow-panel',
  soft: 'border border-brand/12 bg-brand-soft/50 text-ink',
  dark: 'border border-white/8 bg-[#0f2724] text-white',
  brand: 'border border-brand/20 bg-brand text-white shadow-[0_8px_24px_rgba(18,108,98,0.28)]',
};

export const Card = ({
  children,
  className = '',
  hover = false,
  tone = 'default',
  ...props
}: PropsWithChildren<CardProps>) => {
  return (
    <div
      className={[
        'rounded-3xl transition-all duration-200 ease-spring',
        toneClasses[tone],
        hover
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-panel-hover'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};
