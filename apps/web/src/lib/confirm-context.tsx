import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider = ({ children }: PropsWithChildren) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          onClick={() => close(false)}
          role="presentation"
        >
          <div
            aria-modal="true"
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-float animate-fade-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="text-lg font-semibold text-ink">{options.title}</h2>
            {options.message && (
              <p className="mt-2 text-sm leading-6 text-muted">{options.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
                onClick={() => close(false)}
                type="button"
              >
                {options.cancelText ?? 'Отмена'}
              </button>
              <button
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold text-white transition',
                  options.danger
                    ? 'bg-danger hover:brightness-110'
                    : 'bg-brand hover:bg-brand-dark',
                ].join(' ')}
                onClick={() => close(true)}
                type="button"
              >
                {options.confirmText ?? 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};
