import { useState } from 'react';

import { ExchangeForm } from '../components/exchange-form';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  ArrowDownIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  FlashIcon,
  LockIcon,
  RateIcon,
  ShieldIcon,
  SupportIcon,
} from '../components/ui/icons';
import { Section } from '../components/ui/section';
import { useBootstrap } from '../lib/bootstrap-context';

// ── Data helpers ──────────────────────────────────────────────────────────────

type CardItem = { title: string; description: string; icon?: string };
type StatItem = { value: string; label: string };
type StepItem = { title: string; description: string };
type StringListItem = string;

const readRecord = (value: unknown) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const readStringList = (value: unknown, key: string): StringListItem[] => {
  const arr = readRecord(value)?.[key];
  return Array.isArray(arr) ? arr.filter((i): i is string => typeof i === 'string') : [];
};

const readCardList = (value: unknown, key: string): CardItem[] => {
  const arr = readRecord(value)?.[key];
  if (!Array.isArray(arr)) return [];
  return arr.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const t = (item as Record<string, unknown>).title;
    const d = (item as Record<string, unknown>).description;
    const i = (item as Record<string, unknown>).icon;
    if (typeof t !== 'string' || typeof d !== 'string') return [];
    return [{ title: t, description: d, icon: typeof i === 'string' ? i : undefined }];
  });
};

const readStatList = (value: unknown, key: string): StatItem[] => {
  const arr = readRecord(value)?.[key];
  if (!Array.isArray(arr)) return [];
  return arr.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const v = (item as Record<string, unknown>).value;
    const l = (item as Record<string, unknown>).label;
    if (typeof v !== 'string' || typeof l !== 'string') return [];
    return [{ value: v, label: l }];
  });
};

const readStepList = (value: unknown, key: string): StepItem[] => {
  const arr = readRecord(value)?.[key];
  if (!Array.isArray(arr)) return [];
  return arr.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const t = (item as Record<string, unknown>).title;
    const d = (item as Record<string, unknown>).description;
    if (typeof t !== 'string' || typeof d !== 'string') return [];
    return [{ title: t, description: d }];
  });
};

const renderFeatureIcon = (icon?: string) => {
  const cls = 'h-6 w-6';
  if (icon === 'rate') return <RateIcon className={cls} />;
  if (icon === 'shield') return <ShieldIcon className={cls} />;
  if (icon === 'support') return <SupportIcon className={cls} />;
  if (icon === 'flash') return <FlashIcon className={cls} />;
  return <CheckIcon className={cls} />;
};

// ── Page ──────────────────────────────────────────────────────────────────────
export const HomePage = () => {
  const { data, error, isLoading, refresh } = useBootstrap();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="page-shell py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton h-12 w-72" />
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-4 w-56" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-shell">
        <div className="section-card p-12 text-center">
          <p className="text-xl font-semibold text-ink">Не удалось загрузить данные</p>
          <p className="mt-2 text-sm text-muted">{error ?? 'Неизвестная ошибка'}</p>
          <Button className="mt-6" onClick={() => void refresh()}>
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  const hero = data.pages.home.find((s) => s.key === 'hero');
  const trust = data.pages.home.find((s) => s.key === 'trust');
  const about = data.pages.home.find((s) => s.key === 'about');
  const transferInfo = data.pages.home.find((s) => s.key === 'transfer_info');

  const heroStats = readStatList(hero?.metadata, 'stats');
  const trustCards = readCardList(trust?.metadata, 'cards');
  const aboutHighlights = readStringList(about?.metadata, 'highlights');
  const aboutDetailCards = readCardList(about?.metadata, 'detailCards');
  const transferSteps = readStepList(transferInfo?.metadata, 'steps');

  const visibleRates = data.rates.filter(
    (r) =>
      (r.fromCurrency === 'RUB' && r.toCurrency === 'UAH') ||
      (r.fromCurrency === 'UAH' && r.toCurrency === 'RUB'),
  );

  const visibleFaqId = openFaqId ?? data.faq[0]?.id ?? null;

  const scrollToForm = () => {
    document.getElementById('exchange-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-20 pb-10 sm:space-y-24">

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — Hero + Exchange Form
      ════════════════════════════════════════════════════════════ */}
      <section className="page-shell" id="hero">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start xl:grid-cols-[1fr_460px]">

          {/* Left: Hero text */}
          <div className="flex flex-col justify-center pt-4 lg:pt-8 lg:pb-4">
            {/* Eyebrow badge */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              RUB ↔ UAH · Безналичный обмен
            </div>

            {/* Headline */}
            <h1 className="mt-5 font-display font-semibold tracking-tight text-ink">
              <span className="block text-5xl leading-[1.05] sm:text-6xl xl:text-[4.25rem]">
                Обмен рублей
              </span>
              <span className="block text-5xl leading-[1.05] sm:text-6xl xl:text-[4.25rem] text-brand">
                и гривен —
              </span>
              <span className="block text-5xl leading-[1.05] sm:text-6xl xl:text-[4.25rem]">
                онлайн.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-md text-base leading-7 text-muted sm:text-[1.05rem]">
              Укажите параметры перевода, и менеджер подтвердит курс и детали
              в личном чате за 5–10 минут.
            </p>

            {/* Stat chips */}
            {heroStats.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm shadow-sm"
                  >
                    <span className="font-bold text-ink">{stat.value}</span>
                    <span className="text-muted">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                icon={<ArrowDownIcon className="h-4 w-4" />}
                onClick={scrollToForm}
                size="lg"
              >
                Начать обмен
              </Button>
              <button
                className="rounded-full px-5 py-3 text-sm font-semibold text-muted transition hover:text-ink"
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                type="button"
              >
                Как это работает?
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <LockIcon className="h-3.5 w-3.5 text-brand" />
                Курс фиксируется до перевода
              </span>
              <span className="h-3 w-px bg-line" />
              <span className="flex items-center gap-1.5">
                <SupportIcon className="h-3.5 w-3.5 text-brand" />
                Менеджер в чате
              </span>
              <span className="h-3 w-px bg-line" />
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5 text-brand" />
                5–10 минут
              </span>
            </div>
          </div>

          {/* Right: Exchange form */}
          <div className="lg:sticky lg:top-28">
            <ExchangeForm
              banks={data.dictionaries.banks}
              currencies={data.dictionaries.currencies}
              rates={data.rates}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — Features / Trust
      ════════════════════════════════════════════════════════════ */}
      <section className="page-shell" id="features">
        <Section
          eyebrow="Преимущества"
          title="Прозрачно, быстро и с поддержкой"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {trustCards.map((card, idx) => {
              const isFeatured = idx === 0;
              return (
                <Card
                  key={card.title}
                  className={[
                    'p-6 xl:p-7',
                    isFeatured ? 'sm:col-span-2 xl:col-span-1' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  hover
                  tone={isFeatured ? 'dark' : 'default'}
                >
                  <div
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      isFeatured ? 'bg-white/15' : 'bg-brand-soft',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={isFeatured ? 'text-white' : 'text-brand'}>
                      {renderFeatureIcon(card.icon)}
                    </span>
                  </div>
                  <h3
                    className={[
                      'mt-5 text-lg font-semibold',
                      isFeatured ? 'text-white' : 'text-ink',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={[
                      'mt-2.5 text-sm leading-6',
                      isFeatured ? 'text-white/70' : 'text-muted',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {card.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </Section>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 — Live Rates
      ════════════════════════════════════════════════════════════ */}
      {visibleRates.length > 0 && (
        <section className="page-shell" id="rates">
          <Section eyebrow="Курсы валют" title="Актуальные направления обмена">
            <div className="grid gap-4 md:grid-cols-2">
              {visibleRates.map((rate) => (
                <Card key={rate.id} className="overflow-hidden p-0" hover>
                  {/* Dark header strip */}
                  <div className="flex items-center justify-between bg-[#0f2724] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                        {rate.pair}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80">
                      Онлайн
                    </span>
                  </div>

                  {/* Rate value */}
                  <div className="px-6 py-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[2.5rem] font-bold leading-none tracking-tight text-ink">
                          {rate.rate}
                        </div>
                        <div className="mt-1.5 text-sm text-muted">
                          1 {rate.fromCurrency} = {rate.rate} {rate.toCurrency}
                        </div>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
                        <RateIcon className="h-6 w-6 text-brand" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 rounded-2xl border border-line bg-[#f8faf8] px-4 py-2.5 text-xs text-muted">
                      <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                      Курс подтверждается менеджером перед переводом
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          SECTION 4 — О нас (About)
      ════════════════════════════════════════════════════════════ */}
      {about && (
        <section className="page-shell" id="about">
          <div className="overflow-hidden rounded-3xl border border-line/60 shadow-panel">
            <div className="grid lg:grid-cols-2">
              {/* Dark left panel */}
              <div className="bg-[#0f2724] px-8 py-10 text-white sm:px-10 sm:py-12">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  О сервисе
                </div>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  {about.title}
                </h2>
                {about.body && (
                  <p className="mt-4 text-sm leading-7 text-white/65">
                    {about.body.split('\n\n').map((para, i) => (
                      <span key={i} className="block [&+span]:mt-4">
                        {para}
                      </span>
                    ))}
                  </p>
                )}
                {aboutHighlights.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {aboutHighlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm text-white/80">
                        <CheckCircleIcon className="h-4 w-4 mt-0.5 shrink-0 text-[#4ade80]" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* White right panel */}
              <div className="bg-white px-8 py-10 sm:px-10 sm:py-12">
                <div className="grid gap-5 h-full content-center">
                  {aboutDetailCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-line/70 bg-[#f8faf8] p-5 transition hover:border-brand/30 hover:bg-brand-soft/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                          <CheckIcon className="h-4 w-4 text-brand" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-ink">{card.title}</div>
                          <div className="mt-1 text-sm leading-5 text-muted">{card.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.97]"
                    onClick={scrollToForm}
                    type="button"
                  >
                    Начать обмен
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          SECTION 5 — How it Works (Steps)
      ════════════════════════════════════════════════════════════ */}
      {transferSteps.length > 0 && (
        <section className="page-shell">
          <Section
            eyebrow="Как это работает"
            title={transferInfo?.title ?? 'Как проходит обмен'}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {transferSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  {/* Desktop connector */}
                  {index < transferSteps.length - 1 && (
                    <div className="absolute right-0 top-7 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-brand-accent to-transparent xl:block" />
                  )}
                  <Card className="relative h-full overflow-hidden p-6" hover>
                    {/* Big faded step number */}
                    <div className="absolute right-4 top-2 select-none font-display text-6xl font-bold text-ink/[0.04]">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Step number badge */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-sm font-bold text-brand">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <h3 className="mt-5 text-base font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                  </Card>
                </div>
              ))}
            </div>
          </Section>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          SECTION 6 — FAQ
      ════════════════════════════════════════════════════════════ */}
      <section className="page-shell" id="faq">
        <Section eyebrow="FAQ" title="Частые вопросы" centered>
          <div className="mx-auto max-w-3xl space-y-3">
            {data.faq.map((item) => {
              const isOpen = visibleFaqId === item.id;

              return (
                <Card
                  key={item.id}
                  className="cursor-pointer overflow-hidden p-0"
                  onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                >
                  <div className="flex items-center justify-between gap-4 px-6 py-5">
                    <h3 className="text-base font-semibold text-ink">{item.question}</h3>
                    <span
                      className={[
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                        isOpen
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-muted hover:border-brand/50',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="text-lg leading-none font-medium">
                        {isOpen ? '−' : '+'}
                      </span>
                    </span>
                  </div>

                  <div
                    className={[
                      'grid transition-all duration-300 ease-spring',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-line/50 bg-[#f8faf8] px-6 py-5 text-sm leading-7 text-muted">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* CTA after FAQ */}
          <div className="mx-auto mt-8 max-w-3xl">
            <Card className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left" tone="soft">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
                <SupportIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-ink">Остались вопросы?</div>
                <p className="mt-1 text-sm text-muted">
                  Войдите через Telegram и задайте вопрос менеджеру напрямую в чате.
                </p>
              </div>
              <Button onClick={scrollToForm} size="sm">
                Перейти к форме
              </Button>
            </Card>
          </div>
        </Section>
      </section>
    </div>
  );
};
