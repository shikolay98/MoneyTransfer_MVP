import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { telegramLogin } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { readTelegramAuthResult } from '../lib/telegram-login';
import { usePageTitle } from '../lib/use-page-title';

// Landing page for the Telegram OAuth redirect: reads the signed payload from
// the URL, exchanges it for a session via the API, then goes to the dashboard.
export const TelegramCallbackPage = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const done = useRef(false);

  usePageTitle('Вход через Telegram');

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const data = readTelegramAuthResult();
    if (!data) {
      void navigate('/?tg_error=nodata', { replace: true });
      return;
    }

    telegramLogin(data)
      .then(async () => {
        await refresh();
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/?tg_error=auth', { replace: true });
      });
  }, [navigate, refresh]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#eef2f9] px-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand" />
      <div className="text-sm font-medium text-muted">Входим через Telegram…</div>
    </div>
  );
};
