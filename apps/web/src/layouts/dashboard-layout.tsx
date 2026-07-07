import { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

export const DashboardLayout = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      void navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-shell py-8">
      <div className="section-card overflow-hidden">
        <div className="border-b border-line/70 bg-white/80 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                User Space
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
                Личный кабинет
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted">
                {user.firstName ?? user.telegramUsername ?? 'Пользователь'}
              </span>
              <Link className="text-sm font-semibold text-brand" to="/">
                На главную
              </Link>
              <button
                className="text-sm font-semibold text-muted hover:text-ink"
                onClick={() => void logout()}
                type="button"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
        <main className="bg-[#fbfcfb] px-6 py-8" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
