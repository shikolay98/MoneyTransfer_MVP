import { useBootstrap } from '../lib/bootstrap-context';

export const PrivacyPage = () => {
  const { data } = useBootstrap();
  const section = data?.pages.privacy[0];

  return (
    <div className="page-shell">
      <div className="section-card overflow-hidden">
        <div className="border-b border-line/70 bg-[#183734] px-8 py-8 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
            Privacy
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold">
            {section?.title ?? 'Privacy Policy'}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
            {section?.subtitle ?? 'Редактируемый юридический контент для публічної частини сервиса.'}
          </p>
        </div>

        <div className="px-8 py-8 sm:px-10 sm:py-10">
          <p className="max-w-4xl text-base leading-8 text-muted">
            {section?.body ?? 'Контент будет загружаться из backend и редактироваться через админку.'}
          </p>
        </div>
      </div>
    </div>
  );
};
