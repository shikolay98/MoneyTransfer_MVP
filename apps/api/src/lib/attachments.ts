import { randomBytes } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { env } from '../config/env.js';

// Allowed upload types — receipts are images or PDFs.
export const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

const uploadRoot = resolve(process.cwd(), env.UPLOAD_DIR);

export interface AttachmentMeta {
  token: string;
  name: string;
  mime: string;
  size: number;
}

export const ensureUploadDir = async () => {
  if (!existsSync(uploadRoot)) {
    await mkdir(uploadRoot, { recursive: true });
  }
};

// Tokens are cuid-like ids we generate; this guards against path traversal.
const isSafeToken = (token: string) => /^[a-zA-Z0-9_-]{8,64}$/.test(token);

export const attachmentPath = (token: string): string | null => {
  if (!isSafeToken(token)) return null;
  const path = join(uploadRoot, token);
  // Defense in depth: the resolved path must stay inside the upload root.
  if (!resolve(path).startsWith(uploadRoot)) return null;
  return path;
};

export const saveUploadStream = async (
  token: string,
  source: NodeJS.ReadableStream,
): Promise<void> => {
  await ensureUploadDir();
  const path = attachmentPath(token);
  if (!path) throw new Error('Invalid attachment token');
  await pipeline(source, createWriteStream(path));
};

export const attachmentExists = (token: string): boolean => {
  const path = attachmentPath(token);
  return !!path && existsSync(path);
};

export const attachmentSize = async (token: string): Promise<number> => {
  const path = attachmentPath(token);
  if (!path) return 0;
  const info = await stat(path);
  return info.size;
};

export const newAttachmentToken = (): string => randomBytes(24).toString('hex');

// Reads the attachments JSON stored on a message and returns only entries that
// match the requested token — the caller has already checked thread access.
export const findAttachment = (
  attachmentsJson: unknown,
  token: string,
): AttachmentMeta | null => {
  if (!Array.isArray(attachmentsJson)) return null;
  const match = attachmentsJson.find(
    (a) => a && typeof a === 'object' && (a as AttachmentMeta).token === token,
  );
  return (match as AttachmentMeta) ?? null;
};
