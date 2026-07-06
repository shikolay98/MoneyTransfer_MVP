import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';
import { adminLogin } from '../lib/api';
import { useToast } from '../lib/toast-context';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminLogin(email, password);
      await refresh();
      addToast('Добро пожаловать!', 'success');
      void navigate('/admin');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка входа', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5f3] px-4">
      <div className="w-full max-w-md">
        <div className="section-card overflow-hidden">
          <div className="bg-[#16302d] px-8 py-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Admin Space</p>
            <h1 className="mt-2 font-display text-2xl font-semibold">Вход для менеджера</h1>
          </div>

          <form className="px-8 py-8" onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Email
                </label>
                <input
                  autoComplete="email"
                  className="w-full rounded-[18px] border border-line bg-[#f8faf8] px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Пароль
                </label>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-[18px] border border-line bg-[#f8faf8] px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              <button
                className="mt-2 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </div>

            <p className="mt-5 text-center text-xs text-muted">
              По умолчанию: admin@local.test / ChangeMe123!
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
