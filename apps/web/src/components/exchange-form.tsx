import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ChangeEvent } from 'react';
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

const MAX_AMOUNT = 100_000_000;

const exchangeFormSchema = z
  .object({
    sendCurrencyId: z.string().min(1, 'Выберите валюту'),
    receiveCurrencyId: z.string().min(1, 'Выберите валюту'),
    senderBankId: z.string().min(1, 'Выберите банк'),
    receiverBankId: z.string().min(1, 'Выберите банк'),
    amount: z.coerce
      .number({ invalid_type_error: 'Введите сумму' })
      .positive('Введите сумму больше нуля')
      .max(MAX_AMOUNT, 'Сумма слишком большая — уточните лимиты у менеджера'),
    contact: z.string().min(3, 'Укажите контакт для связи').max(200, 'Слишком длинный контакт'),
  })
  .refine((values) => values.sendCurrencyId !== values.receiveCurrencyId, {
    message: 'Выберите разные валюты',
    path: ['receiveCurrencyId'],
  });

type ExchangeFormValues = z.infer<typeof exchangeFormSchema>;

interface ExchangeFormProps {
  currencies: DictionaryOption[];
  banks: DictionaryOption[];
  rates: ExchangeRateItem[];
}

const fieldCls =
  'w-full rounded-2xl border border-line bg-[#f5f8fd] px-4 py-3 text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 focus:shadow-glow';

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

const formatMoney = (value: number) =>
  value.toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    getValues,
    reset,
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

  // If the user logs in after the form was rendered, prefill the empty contact.
  useEffect(() => {
    if (user?.telegramUsername && !getValues('contact')) {
      setValue('contact', `@${user.telegramUsername}`);
    }
  }, [user, getValues, setValue]);

  const sendCurrencyId = watch('sendCurrencyId');
  const receiveCurrencyId = watch('receiveCurrencyId');
  const senderBankId = watch('senderBankId');
  const receiverBankId = watch('receiverBankId');
  const amount = watch('amount');

  const sendCurrency = availableCurrencies.find((c) => c.id === sendCurrencyId) ?? availableCurrencies[0];
  const receiveCurrency = availableCurrencies.find((c) => c.id === receiveCurrencyId) ?? availableCurrencies[1] ?? availableCurrencies[0];
  const senderBank = banks.find((b) => b.id === senderBankId) ?? banks[0];
  const receiverBank = banks.find((b) => b.id === receiverBankId) ?? banks[1] ?? banks[0];

  // With a two-currency pair, picking the same currency on both sides
  // silently swaps the other one instead of showing an error.
  const handleCurrencyChange = (side: 'send' | 'receive', nextId: string) => {
    const other = side === 'send' ? receiveCurrencyId : sendCurrencyId;
    if (nextId === other) {
      const replacement = availableCurrencies.find((c) => c.id !== nextId);
      if (replacement) {
        setValue(side === 'send' ? 'receiveCurrencyId' : 'sendCurrencyId', replacement.id);
      }
    }
    setValue(side === 'send' ? 'sendCurrencyId' : 'receiveCurrencyId', nextId);
  };

  // Rate preview calculation (fee included).
  const matchingRate = rates.find(
    (r) => r.fromCurrency === sendCurrency?.code && r.toCurrency === receiveCurrency?.code,
  );
  const feePercent = matchingRate?.feePercent ? parseFloat(matchingRate.feePercent) : 0;
  const estimatedReceiveValue =
    matchingRate && amount > 0
      ? Number(amount) * parseFloat(matchingRate.rate) * (1 - feePercent / 100)
      : null;

  const handleSwapDirection = () => {
    const values = getValues();
    setValue('sendCurrencyId', values.receiveCurrencyId);
    setValue('receiveCurrencyId', values.sendCurrencyId);
    // Banks are tied to a currency side, so they travel with the swap.
    setValue('senderBankId', values.receiverBankId);
    setValue('receiverBankId', values.senderBankId);
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

  const handleNewRequest = () => {
    setSuccessId(null);
    reset(undefined, { keepDefaultValues: true });
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
            Войдите через Telegram в шапке сайта, чтобы отслеживать статус и общаться
            с менеджером в чате.
          </p>
        )}
        <button
          className="mt-6 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          onClick={handleNewRequest}
          type="button"
        >
          Создать ещё одну заявку
        </button>
      </Card>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <form id="exchange-form" onSubmit={handleSubmit((v) => void onSubmit(v))}>
      <Card className="overflow-hidden p-0 shadow-float">
        {/* Form header */}
        <div className="bg-[#0b1730] px-6 py-3.5 text-white">
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

        <div className="px-6 py-5 space-y-3.5">
          {/* Currency row with swap */}
          <div className="relative grid grid-cols-2 gap-3">
            <Field
              error={errors.sendCurrencyId?.message}
              icon={<span className="text-base">{flagGlyph(sendCurrency?.code)}</span>}
              label="Отправляете"
            >
              <select
                className={fieldCls}
                {...register('sendCurrencyId', {
                  onChange: (e: ChangeEvent<HTMLSelectElement>) =>
                    handleCurrencyChange('send', e.target.value),
                })}
              >
                {availableCurrencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            {/* Swap button */}
            <div className="absolute left-1/2 top-[calc(50%_+_6px)] z-10 -translate-x-1/2 -translate-y-1/2">
              <button
                aria-label="Поменять направление обмена"
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-float transition hover:bg-brand-dark active:scale-90"
                onClick={handleSwapDirection}
                type="button"
                title="Поменять направление обмена"
              >
                <SwapIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <Field
              error={errors.receiveCurrencyId?.message}
              icon={<span className="text-base">{flagGlyph(receiveCurrency?.code)}</span>}
              label="Получаете"
            >
              <select
                className={fieldCls}
                {...register('receiveCurrencyId', {
                  onChange: (e: ChangeEvent<HTMLSelectElement>) =>
                    handleCurrencyChange('receive', e.target.value),
                })}
              >
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
              inputMode="decimal"
              min="1"
              step="1"
              type="number"
              {...register('amount')}
            />
          </Field>

          {/* Rate preview */}
          {estimatedReceiveValue !== null && (
            <div className="rounded-2xl border border-brand/20 bg-brand-soft/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Вы получите примерно</span>
                <span className="text-xs text-muted">
                  курс {matchingRate?.rate} {matchingRate?.fromCurrency}/{matchingRate?.toCurrency}
                </span>
              </div>
              <div className="mt-1 text-xl font-bold text-brand">
                ≈ {formatMoney(estimatedReceiveValue)}{' '}
                <span className="text-base font-semibold">{receiveCurrency?.symbol ?? receiveCurrency?.code}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {feePercent > 0
                  ? `С учётом комиссии ${feePercent}%. Итоговый курс подтверждается менеджером`
                  : 'Итоговый курс подтверждается менеджером'}
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
              autoComplete="username"
              className={fieldCls}
              placeholder="@username"
              type="text"
              {...register('contact')}
            />
          </Field>

          {/* Submit */}
          <button
            className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition-all hover:bg-brand-dark hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Отправляем заявку...' : 'Оставить заявку'}
          </button>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">🔒 Безопасно</span>
            <span aria-hidden="true" className="h-3 w-px bg-line" />
            <span className="flex items-center gap-1">⚡ Быстро</span>
            <span aria-hidden="true" className="h-3 w-px bg-line" />
            <span className="flex items-center gap-1">💬 С поддержкой</span>
          </div>
        </div>
      </Card>
    </form>
  );
};
