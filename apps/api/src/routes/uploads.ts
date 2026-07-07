import type { FastifyPluginAsync } from 'fastify';

import { requireAuth } from '../lib/auth-guard.js';
import {
  ALLOWED_MIME,
  attachmentSize,
  MAX_UPLOAD_BYTES,
  newAttachmentToken,
  saveUploadStream,
} from '../lib/attachments.js';

const uploadRoutes: FastifyPluginAsync = async (app) => {
  // Stores a single file on disk and returns metadata the client then attaches
  // to a chat message. Auth-only; the file is not readable until it is
  // referenced by a message in a thread the requester can access.
  app.post(
    '/api/uploads',
    { preHandler: requireAuth, config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: 'Файл не получен' });
      }

      const mime = file.mimetype;
      if (!ALLOWED_MIME[mime]) {
        return reply
          .status(415)
          .send({ error: 'Поддерживаются только изображения (PNG, JPG, WEBP, GIF) и PDF' });
      }

      const token = newAttachmentToken();
      await saveUploadStream(token, file.file);

      // @fastify/multipart flags truncation when the size limit is exceeded.
      if (file.file.truncated) {
        return reply
          .status(413)
          .send({ error: `Файл больше ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} МБ` });
      }

      const size = await attachmentSize(token);
      const name = file.filename?.slice(0, 200) || `file.${ALLOWED_MIME[mime]}`;

      return { token, name, mime, size };
    },
  );
};

export default uploadRoutes;
