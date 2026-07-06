import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { telegramLogin } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useBootstrap } from '../lib/bootstrap-context';
import { useToast } from '../lib/toast-context';
import { CloseIcon, MenuIcon, TelegramIcon } from '../components/ui/icons';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
const HEADER_SCROLL_DELTA = 40;

const NAV_LINKS = [
  { href: '#faq', label: 'FAQ' },
  { href: '#about', label: 'О нас' },
  { href: '#exchange-form', label: 'Обмен' },
];

const TelegramLoginWidget = ({ onAuth }: { onAuth: (data: Record<string, unknown>) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !BOT_USERNAME) return;

    (window as unknown as Record<string, unknown>)['onTelegramAuth'] = onAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'medium');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>)['onTelegramAuth'];
    };
  }, [onAuth]);

  return <div ref={containerRef} />;
};

export const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useBootstrap();
  const { user, logout, refresh } = useAuth();
  const { addToast } = useToast();
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [showTgWidget, setShowTgWidget] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const lastTogglePointRef = useRef(0);

  const rates = data?.rates.slice(0, 2) ?? [];
  const isAuthed = !!user;
  const isBotConfigured = BOT_USERNAME && BOT_USERNAME !== 'replace_with_bot_username';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;
      const delta = Math.abs(currentScrollY - lastTogglePointRef.current);

      if (currentScrollY <= 20) {
        setIsHeaderHidden(false);
        lastTogglePointRef.current = currentScrollY;
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY && delta >= HEADER_SCROLL_DELTA) {
        setIsHeaderHidden(true);
        setIsMobileMenuOpen(false);
        lastTogglePointRef.current = currentScrollY;
      }

      if (currentScrollY < lastScrollY && delta >= HEADER_SCROLL_DELTA) {
        setIsHeaderHidden(false);
        lastTogglePointRef.current = currentScrollY;
      }

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTelegramAuth = async (tgData: Record<string, unknown>) => {
    setShowTgWidget(false);
    try {
      await telegramLogin(tgData);
      await refresh();
      addToast('Добро пожаловать!', 'success');
      void navigate('/dashboard');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка входа', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast('Вы вышли из аккаунта', 'info');
    if (location.pathname.startsWith('/dashboard')) {
      void navigate('/');
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className={[
          'fixed inset-x-0 top-3 z-50 transition-all duration-300 ease-spring',
          isHeaderHidden ? '-translate-y-[140%]' : 'translate-y-0',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="page-shell">
          <header className="glass-panel rounded-[22px] border border-white/80 px-4 shadow-float sm:px-5">
            <div className="flex h-14 items-center justify-between gap-4">
              {/* Logo */}
              <Link
                className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-ink"
                to="/"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white text-xs font-bold select-none">
                  MT
                </span>
                <span className="hidden sm:block">Money Transfer</span>
                <span className="sm:hidden font-semibold text-base">MT</span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 md:flex">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition hover:bg-ink/5 hover:text-ink"
                    onClick={() => handleNavClick(link.href)}
                    type="button"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* Desktop auth */}
              <div className="hidden items-center gap-2 md:flex">
                {isAuthed ? (
                  <>
                    <span className="text-sm text-muted">
                      {user.firstName ?? user.telegramUsername}
                    </span>
                    <Link
                      className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-brand/60 hover:text-brand"
                      to="/dashboard"
                    >
                      Кабинет
                    </Link>
                    <button
                      className="rounded-full bg-ink/5 px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-ink/10"
                      onClick={() => void handleLogout()}
                      type="button"
                    >
                      Выйти
                    </button>
                  </>
                ) : showTgWidget && isBotConfigured ? (
                  <div className="flex items-center gap-2">
                    <TelegramLoginWidget onAuth={(d) => void handleTelegramAuth(d)} />
                    <button
                      className="text-xs text-muted hover:text-ink"
                      onClick={() => setShowTgWidget(false)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ) : isBotConfigured ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95"
                    onClick={() => setShowTgWidget(true)}
                    type="button"
                  >
                    <TelegramIcon className="h-4 w-4" />
                    Войти через Telegram
                  </button>
                ) : (
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                    to="/admin/login"
                  >
                    Войти
                  </Link>
                )}
              </div>

              {/* Mobile: hamburger */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-ink/5 md:hidden"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                type="button"
                aria-label="Меню"
              >
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
              <div className="border-t border-line/50 pb-4 pt-3 md:hidden">
                <nav className="grid gap-1">
                  {NAV_LINKS.map((link) => (
                    <button
                      key={link.href}
                      className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-ink/5"
                      onClick={() => handleNavClick(link.href)}
                      type="button"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-3 border-t border-line/50 pt-3">
                  {isAuthed ? (
                    <div className="grid gap-2">
                      <Link
                        className="rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                        to="/dashboard"
                      >
                        Личный кабинет
                      </Link>
                      <button
                        className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink"
                        onClick={() => { setIsMobileMenuOpen(false); void handleLogout(); }}
                        type="button"
                      >
                        Выйти
                      </button>
                    </div>
                  ) : isBotConfigured ? (
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
                      onClick={() => { setIsMobileMenuOpen(false); setShowTgWidget(true); }}
                      type="button"
                    >
                      <TelegramIcon className="h-4 w-4" />
                      Войти через Telegram
                    </button>
                  ) : (
                    <Link
                      className="flex items-center justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/login"
                    >
                      Войти
                    </Link>
                  )}
                </div>
              </div>
            )}
          </header>
        </div>
      </div>

      {/* ── Rates ticker (compact, below header) ─────────────────── */}
      {rates.length > 0 && (
        <div className="fixed inset-x-0 top-[4.5rem] z-40 hidden md:block">
          <div className="page-shell">
            <div className="flex items-center gap-3 pt-1">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-white/90 px-3.5 py-1.5 text-xs backdrop-blur-sm shadow-sm"
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-slow" />
                  <span className="font-semibold text-muted">{rate.pair}</span>
                  <span className="font-bold text-ink">{rate.rate}</span>
                </div>
              ))}
              <span className="text-[11px] text-muted/60">Курс подтверждается менеджером</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="pt-[5.5rem] md:pt-[6.5rem]">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="mt-20 border-t border-line/50">
        <div className="page-shell py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white text-xs font-bold">
                  MT
                </span>
                <span className="font-display text-xl font-semibold text-ink">Money Transfer</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
                Сервис безналичного обмена рублей и гривен с подтверждением курса менеджером.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Работаем ежедневно с 8:00 до 22:00
              </div>
            </div>

            {/* Navigation */}
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Навигация
              </div>
              <nav className="grid gap-2">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    className="text-left text-sm text-muted transition hover:text-ink"
                    onClick={() => handleNavClick(link.href)}
                    type="button"
                  >
                    {link.label}
                  </button>
                ))}
                <Link className="text-sm text-muted transition hover:text-ink" to="/privacy">
                  Политика конфиденциальности
                </Link>
                <Link className="text-sm text-muted transition hover:text-ink" to="/terms">
                  Условия использования
                </Link>
              </nav>
            </div>

            {/* Contact */}
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Контакты
              </div>
              <div className="grid gap-2 text-sm text-muted">
                <a
                  className="flex items-center gap-2 transition hover:text-ink"
                  href="https://t.me/moneytransfer_support"
                  rel="noreferrer"
                  target="_blank"
                >
                  <TelegramIcon className="h-4 w-4 text-brand" />
                  @moneytransfer_support
                </a>
                <div className="mt-2 rounded-2xl border border-line bg-[#f8faf8] px-4 py-3">
                  <div className="text-xs font-semibold text-ink">График работы</div>
                  <div className="mt-1 text-xs text-muted">Пн–Вс, 8:00 – 22:00</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line/50 pt-6 text-xs text-muted/60">
            <span>© {new Date().getFullYear()} Money Transfer. Все права защищены.</span>
            <div className="flex gap-4">
              <Link className="hover:text-muted transition" to="/privacy">Конфиденциальность</Link>
              <Link className="hover:text-muted transition" to="/terms">Условия</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
