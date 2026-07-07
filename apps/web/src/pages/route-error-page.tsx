import { useRouteError } from 'react-router-dom';

// Catches data-router errors (e.g. a failed lazy chunk import after a redeploy
// invalidated old hashed filenames) that the React ErrorBoundary cannot see.
export const RouteErrorPage = () => {
  const error = useRouteError();
  console.error('Route error:', error);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-10 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Ошибка</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
          Что-то пошло не так
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Не удалось загрузить страницу. Возможно, вышло обновление сайта —
          обновите страницу, чтобы продолжить.
        </p>
        <button
          className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          onClick={() => window.location.reload()}
          type="button"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
};
