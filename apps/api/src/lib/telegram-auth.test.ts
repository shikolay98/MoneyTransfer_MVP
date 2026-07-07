import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { verifyTelegramAuth, type TelegramAuthData } from './telegram-auth.js';

const BOT_TOKEN = '1234567890:TEST_TOKEN_FOR_UNIT_TESTS';

const signPayload = (payload: Omit<TelegramAuthData, 'hash'>, botToken: string): string => {
  const checkString = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key as keyof typeof payload]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  return createHmac('sha256', secretKey).update(checkString).digest('hex');
};

const freshPayload = (overrides: Partial<TelegramAuthData> = {}): Omit<TelegramAuthData, 'hash'> => ({
  id: 42,
  first_name: 'Ivan',
  username: 'ivan_test',
  auth_date: Math.floor(Date.now() / 1000),
  ...overrides,
});

describe('verifyTelegramAuth', () => {
  it('accepts a correctly signed payload', () => {
    const payload = freshPayload();
    const hash = signPayload(payload, BOT_TOKEN);

    expect(verifyTelegramAuth({ ...payload, hash }, BOT_TOKEN)).toBe(true);
  });

  it('accepts a payload with optional fields present', () => {
    const payload = freshPayload({
      last_name: 'Petrov',
      photo_url: 'https://t.me/i/userpic/320/test.jpg',
    });
    const hash = signPayload(payload, BOT_TOKEN);

    expect(verifyTelegramAuth({ ...payload, hash }, BOT_TOKEN)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const payload = freshPayload();
    const hash = signPayload(payload, BOT_TOKEN);

    expect(verifyTelegramAuth({ ...payload, id: 43, hash }, BOT_TOKEN)).toBe(false);
  });

  it('rejects a payload signed with a different bot token', () => {
    const payload = freshPayload();
    const hash = signPayload(payload, 'other:token');

    expect(verifyTelegramAuth({ ...payload, hash }, BOT_TOKEN)).toBe(false);
  });

  it('rejects an expired auth_date (older than 24h)', () => {
    const payload = freshPayload({
      auth_date: Math.floor(Date.now() / 1000) - 86_401,
    });
    const hash = signPayload(payload, BOT_TOKEN);

    expect(verifyTelegramAuth({ ...payload, hash }, BOT_TOKEN)).toBe(false);
  });

  it('rejects a malformed hash without throwing', () => {
    const payload = freshPayload();

    expect(verifyTelegramAuth({ ...payload, hash: 'not-hex' }, BOT_TOKEN)).toBe(false);
    expect(verifyTelegramAuth({ ...payload, hash: 'abcd' }, BOT_TOKEN)).toBe(false);
    expect(verifyTelegramAuth({ ...payload, hash: '' }, BOT_TOKEN)).toBe(false);
  });
});
