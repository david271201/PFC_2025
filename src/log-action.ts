import { ActionType } from '@prisma/client';

export default function logAction(
  userId: string,
  entityId: string,
  action: ActionType,
  observation?: string,
  entityType: 'request' | 'response' = 'request',
  files?: string[],
) {
  return {
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      request:
        entityType === 'request'
          ? {
              connect: {
                id: entityId,
              },
            }
          : undefined,
      requestResponse:
        entityType === 'response'
          ? {
              connect: {
                id: entityId,
              },
            }
          : undefined,

      action,
      observation,
      files,
    },
  };
}
