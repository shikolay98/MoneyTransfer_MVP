import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HASH_RETRY_INTERVAL_MS = 100;
const HASH_RETRY_LIMIT = 30;

// Content is rendered after async bootstrap, so the hash target may not exist
// yet on first paint — retry briefly until it appears.
const scrollToHash = (hash: string) => {
  const id = hash.replace('#', '');
  let attempts = 0;

  const timer = window.setInterval(() => {
    const el = document.getElementById(id);
    attempts += 1;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.clearInterval(timer);
    } else if (attempts >= HASH_RETRY_LIMIT) {
      window.clearInterval(timer);
    }
  }, HASH_RETRY_INTERVAL_MS);

  return () => window.clearInterval(timer);
};

export const ScrollManager = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      return scrollToHash(hash);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return null;
};
