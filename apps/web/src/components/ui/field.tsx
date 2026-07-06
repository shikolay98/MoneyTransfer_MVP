import type { PropsWithChildren, ReactNode } from 'react';

interface FieldProps {
  error?: string;
  hint?: string;
  icon?: ReactNode;
  label: string;
}

export const Field = ({
  children,
  error,
  hint,
  icon,
  label,
}: PropsWithChildren<FieldProps>) => {
  return (
    <label className="block text-sm font-medium text-ink">
      <span className="flex items-center gap-2">
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-white text-muted shadow-sm">
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </span>
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
};
