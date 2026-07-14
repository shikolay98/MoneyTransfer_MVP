// Full-page Telegram login (no iframe widget, no popup) — reliable across
// browsers. We send the user to Telegram's OAuth page; on success Telegram
// redirects back to /login/telegram with the signed auth data, which the
// callback page verifies via the API.

const CALLBACK_PATH = '/login/telegram';

export const startTelegramLogin = (botId: string) => {
  const origin = window.location.origin;
  const params = new URLSearchParams({
    bot_id: botId,
    origin,
    request_access: 'write',
    return_to: `${origin}${CALLBACK_PATH}`,
  });
  window.location.href = `https://oauth.telegram.org/auth?${params.toString()}`;
};

// Decodes base64url that Telegram uses for the tgAuthResult payload.
const decodeBase64Url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const withPad = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  return decodeURIComponent(
    atob(withPad)
      .split('')
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
};

// Reads the Telegram auth payload from the current URL. Telegram returns it
// either as a `#tgAuthResult=<base64>` hash or as plain query params.
export const readTelegramAuthResult = (): Record<string, unknown> | null => {
  const hash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);
  const encoded = hashParams.get('tgAuthResult');
  if (encoded) {
    try {
      return JSON.parse(decodeBase64Url(encoded)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  const query = new URLSearchParams(window.location.search);
  if (query.get('id') && query.get('hash')) {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of query.entries()) {
      obj[key] = key === 'id' || key === 'auth_date' ? Number(value) : value;
    }
    return obj;
  }

  return null;
};
