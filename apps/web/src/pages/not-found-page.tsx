import { Link } from 'react-router-dom';

import { usePageTitle } from '../lib/use-page-title';

export const NotFoundPage = () => {
  usePageTitle('Страница не найдена');

  return (
    <div className="page-shell py-16">
      <div className="section-card p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">404</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-ink">Страница не найдена</h1>
        <p className="mt-4 text-sm text-muted">
          Проверьте адрес или вернитесь на главную страницу.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white"
          to="/"
        >
          На главную
        </Link>
      </div>
    </div>
  );
};
