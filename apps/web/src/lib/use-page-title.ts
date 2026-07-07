import { useEffect } from 'react';

const APP_NAME = 'Money Transfer';
const DEFAULT_TITLE = `${APP_NAME} — обмен рублей и гривен онлайн`;

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_NAME}` : DEFAULT_TITLE;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
};
