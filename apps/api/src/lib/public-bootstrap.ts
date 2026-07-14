import type { PrismaClient } from '@prisma/client';

import { env } from '../config/env.js';

type PublicPage = 'HOME' | 'PRIVACY' | 'TERMS';

// Exposed to the SPA at runtime so the Telegram bot username never has to be
// baked in at build time (avoids build-arg pitfalls on PaaS hosts).
const telegramBotUsername = (() => {
  const raw = env.TELEGRAM_BOT_USERNAME.trim().replace(/^@/, '');
  return raw && raw !== 'replace_with_bot_username' ? raw : null;
})();

// Numeric bot id (the part before ':' in the token). This is public — it is
// embedded in the Telegram Login Widget too — and lets the SPA start the
// full-page OAuth redirect without any secrets.
const telegramBotId = (() => {
  const id = env.TELEGRAM_BOT_TOKEN.split(':')[0]?.trim();
  return telegramBotUsername && id && /^\d+$/.test(id) ? id : null;
})();

const loadPageSections = async (prisma: PrismaClient, page: PublicPage) => {
  const sections = await prisma.contentSection.findMany({
    where: {
      page,
      isPublished: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  return sections.map((section) => ({
    id: section.id,
    key: section.key,
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    metadata: section.metadata,
  }));
};

export const getPublicBootstrap = async (prisma: PrismaClient) => {
  const [homeSections, privacySections, termsSections, faq, rates, currencies, banks] =
    await Promise.all([
      loadPageSections(prisma, 'HOME'),
      loadPageSections(prisma, 'PRIVACY'),
      loadPageSections(prisma, 'TERMS'),
      prisma.faqItem.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.exchangeRate.findMany({
        where: { isActive: true },
        include: {
          fromCurrency: true,
          toCurrency: true,
        },
        orderBy: [{ fromCurrency: { sortOrder: 'asc' } }, { toCurrency: { sortOrder: 'asc' } }],
      }),
      prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.bank.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

  const allowedPairs = new Set(['RUB/UAH', 'UAH/RUB']);
  const visibleRates = rates.filter((rate) =>
    allowedPairs.has(`${rate.fromCurrency.code}/${rate.toCurrency.code}`),
  );
  const visibleCurrencyCodes = new Set(
    visibleRates.flatMap((rate) => [rate.fromCurrency.code, rate.toCurrency.code]),
  );

  return {
    config: {
      telegramBotUsername,
      telegramBotId,
    },
    pages: {
      home: homeSections,
      privacy: privacySections,
      terms: termsSections,
    },
    faq: faq.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
    rates: visibleRates.map((rate) => ({
      id: rate.id,
      pair: `${rate.fromCurrency.code}/${rate.toCurrency.code}`,
      fromCurrency: rate.fromCurrency.code,
      toCurrency: rate.toCurrency.code,
      rate: rate.rate.toString(),
      feePercent: rate.feePercent?.toString() ?? null,
      note: rate.note,
    })),
    dictionaries: {
      currencies: currencies
        .filter((currency) => visibleCurrencyCodes.has(currency.code))
        .map((currency) => ({
          id: currency.id,
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
        })),
      banks: banks.map((bank) => ({
        id: bank.id,
        code: bank.code,
        name: bank.name,
      })),
    },
  };
};
