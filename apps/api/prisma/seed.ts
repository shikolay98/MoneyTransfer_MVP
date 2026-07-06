import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { ContentPage, PrismaClient, UserRole } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const seedEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_NAME: z.string().min(1),
});

const env = seedEnvSchema.parse(process.env);

const homeSections = [
  {
    page: ContentPage.HOME,
    key: 'hero',
    title: 'Обмен безналичной гривны ↔ рубля онлайн',
    subtitle: 'Hero block for public landing',
    body: 'Войдите через Telegram и после этого вы получите доступ к личному чату с менеджером.',
    metadata: {
      eyebrow: 'RUB ↔ UAH',
      badge: 'Онлайн-обмен валют',
      primaryActionLabel: 'Перейти к обмену',
      secondaryActionLabel: 'Открыть чат',
      stats: [
        { value: '5–10 мин', label: 'среднее время обмена' },
        { value: 'RUB ↔ UAH', label: 'основное направление' },
        { value: '1:1', label: 'чат с менеджером' },
      ],
    },
    sortOrder: 1,
  },
  {
    page: ContentPage.HOME,
    key: 'trust',
    title: 'Преимущества сервиса',
    subtitle: 'Trust section for public landing',
    body: 'Короткий блок с причинами, почему пользователи выбирают сервис.',
    metadata: {
      cards: [
        {
          title: 'Выгодный курс',
          description: 'Курс подтверждается перед переводом и не меняется по ходу сделки.',
          icon: 'rate',
        },
        {
          title: 'Понятный процесс',
          description: 'Перед переводом менеджер подтверждает детали и порядок обмена.',
          icon: 'shield',
        },
        {
          title: 'Менеджер 24/7',
          description: 'Все вопросы и подтверждения проходят в личном чате с менеджером.',
          icon: 'support',
        },
        {
          title: 'Быстро',
          description: 'После подтверждения обмен обычно занимает 5–10 минут.',
          icon: 'flash',
        },
      ],
    },
    sortOrder: 2,
  },
  {
    page: ContentPage.HOME,
    key: 'about',
    title: 'Сервис, где финансовый процесс понятен',
    subtitle: 'About section for public landing',
    body: 'Мы помогаем безопасно и удобно обменивать безналичную гривну на рубли и наоборот. Работаем с картами украинских и российских банков, сопровождая клиента на каждом этапе сделки.\n\nКурс фиксируется перед переводом, а менеджер остаётся с вами в чате до завершения операции.',
    metadata: {
      highlights: [
        'Актуальный курс виден до подтверждения обмена',
        'Весь процесс идёт в одном чате с менеджером',
        'История обращения сохраняется в аккаунте пользователя',
      ],
      detailCards: [
        {
          title: 'Без лишних шагов',
          description: 'Только валюта, банки, сумма и Telegram для связи.',
        },
        {
          title: 'Чат вместо хаоса',
          description: 'После заявки менеджер продолжает процесс прямо в личном диалоге.',
        },
        {
          title: 'Подготовлено под рост',
          description: 'Сервис уже готов под кабинет, историю заявок и дальнейшую автоматизацию.',
        },
      ],
    },
    sortOrder: 3,
  },
  {
    page: ContentPage.HOME,
    key: 'transfer_info',
    title: 'Как это работает',
    subtitle: 'Transfer information block',
    body: '',
    metadata: {
      steps: [
        {
          title: 'Заполните параметры',
          description: 'Выберите валюту, банк и сумму перевода',
        },
        {
          title: 'Получите подтверждение',
          description: 'Менеджер уточнит детали и курс',
        },
        {
          title: 'Выполните перевод',
          description: 'Следуйте инструкции и отправьте средства',
        },
        {
          title: 'Получите деньги',
          description: 'Средства поступят на карту получателя',
        },
      ],
      noteTitle: 'После заявки',
      noteBody:
        'Если вы вошли через Telegram или оставили контакт, дальше обмен продолжается в личном чате с менеджером.',
    },
    sortOrder: 4,
  },
  {
    page: ContentPage.HOME,
    key: 'footer',
    title: 'Контакты и юридическая информация',
    subtitle: 'Footer content for public landing',
    body: '',
    metadata: {
      supportEmail: 'support@local.test',
      supportHours: '08:00 - 22:00',
      supportTelegram: '@moneytransfer_support',
      legalNote: 'Информация на сайте носит справочный характер и уточняется менеджером перед обменом.',
    },
    sortOrder: 5,
  },
];

const policySections = [
  {
    page: ContentPage.PRIVACY,
    key: 'privacy_body',
    title: 'Privacy Policy',
    subtitle: 'Черновой редактируемый текст для MVP',
    body: 'Placeholder privacy policy для MVP. Здесь позже будет полный документ о данных пользователя, хранении Telegram identity, cookie-based сессии, обработке сообщений и заявок.',
    metadata: {},
    sortOrder: 1,
  },
];

const termsSections = [
  {
    page: ContentPage.TERMS,
    key: 'terms_body',
    title: 'Terms of Service',
    subtitle: 'Черновой редактируемый текст для MVP',
    body: 'Placeholder terms для MVP. Здесь позже будет оферта сервиса, описание логики заявок, общие ограничения, порядок подтверждения курса и правила коммуникации с менеджером.',
    metadata: {},
    sortOrder: 1,
  },
];

const faqItems = [
  {
    question: 'Как быстро проходит обмен?',
    answer: 'В среднем 5–10 минут после подтверждения',
    sortOrder: 1,
  },
  {
    question: 'Как подтверждается курс?',
    answer: 'Менеджер подтверждает курс в личном чате перед переводом',
    sortOrder: 2,
  },
  {
    question: 'Можно ли уточнить курс?',
    answer: 'Да, менеджер всегда на связи',
    sortOrder: 3,
  },
  {
    question: 'Нужно ли регистрироваться?',
    answer: 'Да, чтоб видеть историю чата с менеджером, вам нужно иметь свой аккаунт на сайте',
    sortOrder: 4,
  },
];

const currencies = [
  { code: 'RUB', name: 'Российский рубль', symbol: '₽', sortOrder: 1 },
  { code: 'UAH', name: 'Украинская гривна', symbol: '₴', sortOrder: 2 },
];

const banks = [
  { code: 'SBER', name: 'Сбербанк', countryCode: 'RU', sortOrder: 1 },
  { code: 'TINKOFF', name: 'Т-Банк', countryCode: 'RU', sortOrder: 2 },
  { code: 'ALFA', name: 'Альфа-Банк', countryCode: 'RU', sortOrder: 3 },
  { code: 'MONO', name: 'Monobank', countryCode: 'UA', sortOrder: 4 },
  { code: 'PRIVAT', name: 'ПриватБанк', countryCode: 'UA', sortOrder: 5 },
];

const ratePairs = [
  { from: 'RUB', to: 'UAH', rate: '0.460000', feePercent: '0.80', note: '' },
  { from: 'UAH', to: 'RUB', rate: '2.180000', feePercent: '0.80', note: '' },
];

const upsertSections = async () => {
  for (const section of [...homeSections, ...policySections, ...termsSections]) {
    await prisma.contentSection.upsert({
      where: {
        page_key: {
          page: section.page,
          key: section.key,
        },
      },
      update: {
        title: section.title,
        subtitle: section.subtitle,
        body: section.body,
        metadata: section.metadata,
        sortOrder: section.sortOrder,
        isPublished: true,
      },
      create: {
        page: section.page,
        key: section.key,
        title: section.title,
        subtitle: section.subtitle,
        body: section.body,
        metadata: section.metadata,
        sortOrder: section.sortOrder,
        isPublished: true,
      },
    });
  }
};

const upsertFaq = async () => {
  await prisma.faqItem.updateMany({
    where: {
      question: {
        notIn: faqItems.map((item) => item.question),
      },
    },
    data: {
      isPublished: false,
    },
  });

  for (const item of faqItems) {
    await prisma.faqItem.upsert({
      where: {
        question: item.question,
      },
      update: {
        answer: item.answer,
        sortOrder: item.sortOrder,
        isPublished: true,
      },
      create: {
        question: item.question,
        answer: item.answer,
        sortOrder: item.sortOrder,
        isPublished: true,
      },
    });
  }
};

const main = async () => {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      role: UserRole.ADMIN,
      passwordHash,
      firstName: env.ADMIN_NAME,
      isActive: true,
    },
    create: {
      email: env.ADMIN_EMAIL,
      role: UserRole.ADMIN,
      passwordHash,
      firstName: env.ADMIN_NAME,
      isActive: true,
    },
  });

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { code: bank.code },
      update: bank,
      create: bank,
    });
  }

  await upsertSections();
  await upsertFaq();

  for (const pair of ratePairs) {
    const [fromCurrency, toCurrency] = await Promise.all([
      prisma.currency.findUniqueOrThrow({ where: { code: pair.from } }),
      prisma.currency.findUniqueOrThrow({ where: { code: pair.to } }),
    ]);

    await prisma.exchangeRate.upsert({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id,
        },
      },
      update: {
        rate: pair.rate,
        feePercent: pair.feePercent,
        note: pair.note,
        isActive: true,
        updatedById: admin.id,
      },
      create: {
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        rate: pair.rate,
        feePercent: pair.feePercent,
        note: pair.note,
        isActive: true,
        updatedById: admin.id,
      },
    });
  }

  console.log('Seed completed successfully');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
