import type { PropsWithChildren, ReactNode } from 'react';

interface SectionProps {
  actions?: ReactNode;
  description?: string | null;
  eyebrow?: string | null;
  title: string;
  centered?: boolean;
}

export const Section = ({
  actions,
  centered = false,
  children,
  description,
  eyebrow,
  title,
}: PropsWithChildren<SectionProps>) => {
  return (
    <div className="space-y-8">
      <div
        className={[
          'flex flex-wrap items-end justify-between gap-4',
          centered ? 'flex-col items-center text-center' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={centered ? 'max-w-2xl' : 'max-w-3xl'}>
          {eyebrow ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              <span className="h-1 w-1 rounded-full bg-brand opacity-70" />
              {eyebrow}
            </div>
          ) : null}
          <h2
            className={[
              'font-display font-semibold text-ink',
              eyebrow ? 'mt-3' : '',
              'text-3xl leading-tight sm:text-4xl',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-base leading-7 text-muted sm:text-[1.05rem]">{description}</p>
          ) : null}
        </div>
        {!centered && actions ? actions : null}
      </div>
      {children}
    </div>
  );
};
