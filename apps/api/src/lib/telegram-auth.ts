import { createHash, createHmac } from 'node:crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const verifyTelegramAuth = (data: TelegramAuthData, botToken: string): boolean => {
  const { hash, ...rest } = data;

  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

  const authDate = rest.auth_date;
  const maxAge = 86400;
  const now = Math.floor(Date.now() / 1000);

  if (now - authDate > maxAge) {
    return false;
  }

  return hmac === hash;
};
