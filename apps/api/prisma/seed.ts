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
    // Каждая строка заголовка отделяется \n; вторая строка подсвечивается брендовым цветом.
    title: 'Обмен рублей\nи гривен —\nонлайн.',
    subtitle: 'Hero block for public landing',
    body: 'Укажите параметры перевода, и менеджер подтвердит курс и детали в личном чате за 5–10 минут.',
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
    title: 'Политика конфиденциальности',
    subtitle: 'Какие данные мы обрабатываем и зачем они нужны сервису.',
    body: [
      '1. Общие положения. Настоящая политика описывает, какие данные обрабатывает сервис Money Transfer (далее — «Сервис») и как они используются. Используя Сервис, вы соглашаетесь с условиями этой политики.',
      '2. Какие данные мы собираем. При входе через Telegram мы получаем и храним: идентификатор Telegram, имя, фамилию (если указана), username и ссылку на фото профиля. При создании заявки на обмен мы сохраняем параметры заявки (валюты, банки, сумму), контакт для связи и примечания. Сообщения в чате с менеджером сохраняются для истории обращения.',
      '3. Файлы cookie. Для авторизации Сервис использует один httpOnly cookie с токеном сессии. Мы не используем сторонние трекеры и рекламные cookie.',
      '4. Как используются данные. Данные используются исключительно для обработки заявок на обмен, связи с вами через чат и поддержания работы личного кабинета. Мы не передаём данные третьим лицам, за исключением случаев, предусмотренных законом.',
      '5. Хранение и защита. Данные хранятся в защищённой базе данных. Доступ к ним имеют только менеджеры Сервиса. Действия менеджеров с курсами, контентом и заявками журналируются.',
      '6. Ваши права. Вы можете запросить удаление аккаунта и связанных с ним данных, обратившись к менеджеру в чате или по контактам, указанным на сайте.',
      '7. Изменения политики. Мы можем обновлять эту политику. Актуальная версия всегда доступна на этой странице.',
    ].join('\n\n'),
    metadata: {},
    sortOrder: 1,
  },
];

const termsSections = [
  {
    page: ContentPage.TERMS,
    key: 'terms_body',
    title: 'Условия использования',
    subtitle: 'Правила работы сервиса и порядок проведения обмена.',
    body: [
      '1. О сервисе. Money Transfer — сервис информационного сопровождения безналичного обмена валют (RUB ↔ UAH). Все операции подтверждаются менеджером в личном чате.',
      '2. Заявка на обмен. Заявка, созданная на сайте, не является публичной офертой и не обязывает стороны к совершению сделки. Итоговый курс, комиссия и порядок перевода подтверждаются менеджером до начала операции.',
      '3. Курс и комиссия. Курсы на сайте носят справочный характер и могут быть изменены до подтверждения менеджером. После подтверждения курс фиксируется на время выполнения операции.',
      '4. Порядок обмена. После подтверждения деталей менеджер передаёт реквизиты для перевода. Перевод средств выполняется только после подтверждения менеджером. Сервис не несёт ответственности за переводы, выполненные до подтверждения или на реквизиты, полученные вне чата Сервиса.',
      '5. Ограничения. Сервис вправе отказать в проведении операции без объяснения причин, в том числе при подозрении на мошенничество. Запрещено использовать Сервис для легализации средств, полученных преступным путём.',
      '6. Аккаунт. Для доступа к истории заявок и чату используется вход через Telegram. Вы несёте ответственность за сохранность доступа к своему аккаунту Telegram.',
      '7. Поддержка. Все вопросы по операциям решаются в чате с менеджером или по контактам, указанным на сайте. Часы работы указаны в подвале сайта.',
      '8. Изменения условий. Сервис может обновлять эти условия. Продолжение использования Сервиса означает согласие с актуальной версией.',
    ].join('\n\n'),
    metadata: {},
    sortOrder: 1,
  },
];

const faqItems = [
  {
    question: 'Как быстро проходит обмен?',
    answer:
      'В среднем 5–10 минут после подтверждения деталей менеджером. В часы пиковой нагрузки обмен может занять немного больше времени — менеджер предупредит об этом в чате.',
    sortOrder: 1,
  },
  {
    question: 'Как подтверждается курс?',
    answer:
      'Курс на сайте — справочный. Перед переводом менеджер подтверждает итоговый курс в личном чате, после чего он фиксируется на время операции и не меняется.',
    sortOrder: 2,
  },
  {
    question: 'Есть ли комиссия?',
    answer:
      'Комиссия уже учтена в курсе или показана отдельно в расчёте на сайте. Итоговую сумму к получению менеджер подтверждает до перевода — скрытых платежей нет.',
    sortOrder: 3,
  },
  {
    question: 'Нужно ли регистрироваться?',
    answer:
      'Заявку можно оставить без регистрации, указав Telegram для связи. Вход через Telegram открывает личный кабинет: историю заявок и чат с менеджером.',
    sortOrder: 4,
  },
  {
    question: 'Это безопасно?',
    answer:
      'Перевод выполняется только после подтверждения деталей менеджером и только по реквизитам, полученным в чате сервиса. История заявки и вся переписка сохраняются в вашем кабинете.',
    sortOrder: 5,
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

// Seed is intentionally create-only for editable content: re-running it must
// never clobber changes made by the admin through the panel.
// Set SEED_FORCE_CONTENT=true to overwrite content with the seed defaults.
const forceContent = process.env.SEED_FORCE_CONTENT === 'true';

const upsertSections = async () => {
  for (const section of [...homeSections, ...policySections, ...termsSections]) {
    const seedData = {
      title: section.title,
      subtitle: section.subtitle,
      body: section.body,
      metadata: section.metadata,
      sortOrder: section.sortOrder,
      isPublished: true,
    };

    await prisma.contentSection.upsert({
      where: {
        page_key: {
          page: section.page,
          key: section.key,
        },
      },
      update: forceContent ? seedData : {},
      create: {
        page: section.page,
        key: section.key,
        ...seedData,
      },
    });
  }
};

const upsertFaq = async () => {
  for (const item of faqItems) {
    await prisma.faqItem.upsert({
      where: {
        question: item.question,
      },
      update: forceContent
        ? { answer: item.answer, sortOrder: item.sortOrder, isPublished: true }
        : {},
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

  // The admin password is set on create only. To recover a lost password,
  // re-run the seed with SEED_RESET_ADMIN_PASSWORD=true.
  const resetAdminPassword = process.env.SEED_RESET_ADMIN_PASSWORD === 'true';

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      role: UserRole.ADMIN,
      isActive: true,
      ...(resetAdminPassword ? { passwordHash } : {}),
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
      // Rates are managed by the admin — never overwrite them on re-seed.
      update: {},
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
