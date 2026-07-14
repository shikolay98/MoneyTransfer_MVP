export interface ContentSection {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  metadata: unknown;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ExchangeRateItem {
  id: string;
  pair: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  feePercent: string | null;
  note: string | null;
}

export interface DictionaryOption {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
}

export interface PublicBootstrap {
  config: {
    telegramBotUsername: string | null;
    telegramBotId: string | null;
  };
  pages: {
    home: ContentSection[];
    privacy: ContentSection[];
    terms: ContentSection[];
  };
  faq: FaqItem[];
  rates: ExchangeRateItem[];
  dictionaries: {
    currencies: DictionaryOption[];
    banks: DictionaryOption[];
  };
}
