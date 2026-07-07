import { useBootstrap } from '../lib/bootstrap-context';
import { usePageTitle } from '../lib/use-page-title';

export const TermsPage = () => {
  const { data } = useBootstrap();
  const section = data?.pages.terms[0];

  usePageTitle('Условия использования');

  return (
    <div className="page-shell">
      <div className="section-card overflow-hidden">
        <div className="border-b border-line/70 bg-[#183734] px-8 py-8 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
            Terms
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold">
            {section?.title ?? 'Условия использования'}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">
            {section?.subtitle ?? 'Правила работы сервиса и порядок проведения обмена.'}
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
