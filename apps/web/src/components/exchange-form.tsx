import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { createExchangeRequest } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useToast } from '../lib/toast-context';
import type { DictionaryOption, ExchangeRateItem } from '../types/public';
import { Card } from './ui/card';
import { Field } from './ui/field';
import { CoinsIcon, SwapIcon, ShieldIcon, CheckCircleIcon } from './ui/icons';

const exchangeFormSchema = z.object({
  sendCurrencyId: z.string().min(1, 'Выберите валюту'),
  receiveCurrencyId: z.string().min(1, 'Выберите валюту'),
  senderBankId: z.string().min(1, 'Выберите банк'),
  receiverBankId: z.string().min(1, 'Выберите банк'),
  amount: z.coerce.number().positive('Введите сумму больше нуля'),
  contact: z.string().min(3, 'Укажите контакт для связи'),
});

type ExchangeFormValues = z.infer<typeof exchangeFormSchema>;

interface ExchangeFormProps {
  currencies: DictionaryOption[];
  banks: DictionaryOption[];
  rates: ExchangeRateItem[];
}

const fieldCls =
  'w-full rounded-2xl border border-line bg-[#f8faf8] px-4 py-3 text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:shadow-glow';

const flagGlyph = (code?: string) => {
  if (code === 'UAH') return '🇺🇦';
  if (code === 'RUB') return '🇷🇺';
  if (code === 'USD') return '🇺🇸';
  if (code === 'EUR') return '🇪🇺';
  return '💱';
};

const bankGlyph = (code?: string) => {
  const glyphs: Record<string, string> = {
    MONO: 'M', PRIVAT: 'P', SBER: 'С', TINKOFF: 'Т', ALFA: 'А',
  };
  return glyphs[code ?? ''] ?? 'B';
};

export const ExchangeForm = ({ currencies, banks, rates }: ExchangeFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const availableCurrencies = currencies.filter(
    (c) => c.code === 'RUB' || c.code === 'UAH',
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExchangeFormValues>({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues: {
      sendCurrencyId: availableCurrencies[0]?.id ?? '',
      receiveCurrencyId: availableCurrencies[1]?.id ?? availableCurrencies[0]?.id ?? '',
      senderBankId: banks[0]?.id ?? '',
      receiverBankId: banks[1]?.id ?? banks[0]?.id ?? '',
      amount: 10000,
      contact: user?.telegramUsername ? `@${user.telegramUsername}` : '',
    },
  });

  const sendCurrencyId = watch('sendCurrencyId');
  const receiveCurrencyId = watch('receiveCurrencyId');
  const senderBankId = watch('senderBankId');
  const receiverBankId = watch('receiverBankId');
  const amount = watch('amount');

  const sendCurrency = availableCurrencies.find((c) => c.id === sendCurrencyId) ?? availableCurrencies[0];
  const receiveCurrency = availableCurrencies.find((c) => c.id === receiveCurrencyId) ?? availableCurrencies[1] ?? availableCurrencies[0];
  const senderBank = banks.find((b) => b.id === senderBankId) ?? banks[0];
  const receiverBank = banks.find((b) => b.id === receiverBankId) ?? banks[1] ?? banks[0];

  // Rate preview calculation
  const matchingRate = rates.find(
    (r) => r.fromCurrency === sendCurrency?.code && r.toCurrency === receiveCurrency?.code,
  );
  const estimatedReceive =
    matchingRate && amount > 0
      ? (Number(amount) * parseFloat(matchingRate.rate)).toLocaleString('ru', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const handleSwapCurrencies = () => {
    const prevSend = sendCurrencyId;
    const prevReceive = receiveCurrencyId;
    setValue('sendCurrencyId', prevReceive);
    setValue('receiveCurrencyId', prevSend);
  };

  const onSubmit = async (values: ExchangeFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createExchangeRequest(values);
      setSuccessId(result.id);
      addToast('Заявка создана! Менеджер скоро свяжется.', 'success');
      if (user) {
        setTimeout(() => void navigate('/dashboard'), 1800);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Ошибка создания заявки', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ────────────────────────────────────────────
  if (successId) {
    return (
      <Card className="p-10 text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/10">
          <CheckCircleIcon className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-ink">Заявка принята!</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Заявка{' '}
          <span className="font-mono text-xs font-semibold text-brand">
            #{successId.slice(-8)}
          </span>{' '}
          создана. Менеджер свяжется с вами в ближайшее время.
        </p>
        {user ? (
          <p className="mt-3 text-xs text-brand">Переходим в личный кабинет...</p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Войдите через Telegram для отслеживания статуса и общения с менеджером.
          </p>
        )}
      </Card>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <form id="exchange-form" onSubmit={handleSubmit((v) => void onSubmit(v))}>
      <Card className="overflow-hidden p-0 shadow-float">
        {/* Form header */}
        <div className="bg-[#0f2724] px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
                Расчёт перевода
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">Заполните параметры</p>
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              Онлайн
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          {/* Currency row with swap */}
          <div className="relative grid grid-cols-2 gap-3">
            <Field
              error={errors.sendCurrencyId?.message}
              icon={<span className="text-base">{flagGlyph(sendCurrency?.code)}</span>}
              label="Отправляете"
            >
              <select className={fieldCls} {...register('sendCurrencyId')}>
                {availableCurrencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            {/* Swap button */}
            <div className="absolute left-1/2 top-[calc(50%_+_6px)] z-10 -translate-x-1/2 -translate-y-1/2">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-float transition hover:bg-brand-dark active:scale-90"
                onClick={handleSwapCurrencies}
                type="button"
                title="Поменять валюты"
              >
                <SwapIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <Field
              error={errors.receiveCurrencyId?.message}
              icon={<span className="text-base">{flagGlyph(receiveCurrency?.code)}</span>}
              label="Получаете"
            >
              <select className={fieldCls} {...register('receiveCurrencyId')}>
                {availableCurrencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Bank row */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              error={errors.senderBankId?.message}
              icon={<span className="text-xs font-bold text-brand">{bankGlyph(senderBank?.code)}</span>}
              label="Ваш банк"
            >
              <select className={fieldCls} {...register('senderBankId')}>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>

            <Field
              error={errors.receiverBankId?.message}
              icon={<span className="text-xs font-bold text-brand">{bankGlyph(receiverBank?.code)}</span>}
              label="Банк получателя"
            >
              <select className={fieldCls} {...register('receiverBankId')}>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Amount */}
          <Field error={errors.amount?.message} icon={<CoinsIcon />} label="Сумма перевода">
            <input
              className={fieldCls}
              min="1"
              step="1"
              type="number"
              {...register('amount')}
            />
          </Field>

          {/* Rate preview */}
          {estimatedReceive && (
            <div className="rounded-2xl border border-brand/20 bg-brand-soft/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Вы получите примерно</span>
                <span className="text-xs text-muted">
                  курс {matchingRate?.rate} {matchingRate?.fromCurrency}/{matchingRate?.toCurrency}
                </span>
              </div>
              <div className="mt-1 text-xl font-bold text-brand">
                ≈ {estimatedReceive}{' '}
                <span className="text-base font-semibold">{receiveCurrency?.symbol ?? receiveCurrency?.code}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                Итоговый курс подтверждается менеджером
              </p>
            </div>
          )}

          {/* Contact / Telegram */}
          <Field
            error={errors.contact?.message}
            hint="Telegram для связи с менеджером"
            icon={<ShieldIcon />}
            label="Telegram"
          >
            <input
              className={fieldCls}
              placeholder="@username"
              type="text"
              {...register('contact')}
            />
          </Field>

          {/* Submit */}
          <button
            className="w-full rounded-full bg-brand py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(18,108,98,0.28)] transition-all hover:bg-brand-dark hover:shadow-[0_12px_28px_rgba(18,108,98,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Отправляем заявку...' : 'Продолжить обмен →'}
          </button>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">🔒 Безопасно</span>
            <span className="h-3 w-px bg-line" />
            <span className="flex items-center gap-1">⚡ Быстро</span>
            <span className="h-3 w-px bg-line" />
            <span className="flex items-center gap-1">💬 С поддержкой</span>
          </div>
        </div>
      </Card>
    </form>
  );
};
