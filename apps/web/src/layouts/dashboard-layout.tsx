import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

export const DashboardLayout = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // The chat sub-route renders a full-height, messenger-style screen with no
  // dashboard chrome, so it gets the whole viewport on mobile and desktop.
  const isChat = location.pathname.includes('/chat/');

  useEffect(() => {
    if (!isLoading && !user) {
      void navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-muted text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!user) return null;

  if (isChat) {
    return (
      <div className="min-h-[100dvh] bg-[#eef2f9]" id="main-content">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="page-shell py-4 sm:py-8">
      <div className="section-card overflow-hidden">
        <div className="border-b border-line/70 bg-white/80 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                User Space
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
                Личный кабинет
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted sm:block">
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
        <main className="bg-[#f7f9fc] px-4 py-5 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
