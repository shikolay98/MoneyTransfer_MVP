import { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

export const AdminLayout = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      void navigate('/admin/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="page-shell pb-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="section-card overflow-hidden border-ink/5">
        <div className="border-b border-line/70 bg-[#0b1730] px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Admin Space
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold">Панель управления</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-sm text-white/70 sm:block">
                {user.firstName ?? user.email}
              </span>
              <Link
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/"
              >
                На публичный сайт
              </Link>
              <button
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                onClick={() => void logout()}
                type="button"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
        <main className="bg-white px-6 py-8" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
