import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const MAX_AUTH_AGE_SECONDS = 86_400;

export const verifyTelegramAuth = (data: TelegramAuthData, botToken: string): boolean => {
  const { hash, ...rest } = data;

  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(checkString).digest();

  const now = Math.floor(Date.now() / 1000);
  if (now - rest.auth_date > MAX_AUTH_AGE_SECONDS) {
    return false;
  }

  let received: Buffer;
  try {
    received = Buffer.from(hash, 'hex');
  } catch {
    return false;
  }

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
};
