import { useBootstrap } from '../lib/bootstrap-context';
import { usePageTitle } from '../lib/use-page-title';

export const PrivacyPage = () => {
  const { data } = useBootstrap();
  const section = data?.pages.privacy[0];

  usePageTitle('Политика конфиденциальности');

  return (
    <div className="page-shell">
      <div className="section-card overflow-hidden">
        <div className="border-b border-line/70 bg-[#183734] px-8 py-8 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
            Privacy
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold">
            {section?.title ?? 'Политика конфиденциальности'}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">
            {section?.subtitle ?? 'Какие данные обрабатывает сервис и как они используются.'}
          </p>
        </div>

        <div className="px-8 py-8 sm:px-10 sm:py-10">
          <div className="max-w-4xl space-y-5">
            {(section?.body ?? 'Документ готовится к публикации.')
              .split('\n\n')
              .map((paragraph, index) => (
                <p key={index} className="text-base leading-8 text-muted">
                  {paragraph}
                </p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
