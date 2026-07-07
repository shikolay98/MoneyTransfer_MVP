import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';

interface AuditEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Prisma.InputJsonValue;
}

// Fire-and-forget: an audit failure must never break the main operation.
export const audit = (app: FastifyInstance, entry: AuditEntry) => {
  void app.prisma.auditLog
    .create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        payload: entry.payload,
      },
    })
    .catch((error) => {
      app.log.error({ err: error, entry: entry.action }, 'Failed to write audit log');
    });
};
