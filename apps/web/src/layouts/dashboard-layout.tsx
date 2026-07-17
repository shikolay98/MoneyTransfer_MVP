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
    // Lock the page to the viewport so only the messages list scrolls — the
    // chat card stays fixed and centered, never dragging the page around.
    return (
      <div className="h-[100dvh] overflow-hidden bg-[#eef2f9]" id="main-content">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="page-shell pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pb-8 sm:pt-[calc(2rem+env(safe-area-inset-top))]">
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
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-sm text-muted sm:block">
                {user.firstName ?? user.telegramUsername ?? 'Пользователь'}
              </span>
              <Link
                className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
                to="/"
              >
                На главную
              </Link>
              <button
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
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
