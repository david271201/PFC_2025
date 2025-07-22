import logAction from '@/log-action';
import { checkPermission, UserType, statusTransitions } from '@/permissions/utils';
import { isStatusForRole } from '@/utils';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { ActionType, RequestStatus } from '@prisma/client';
import formidable from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await auth(req, res);
  const { userId, role } = session?.user as UserType;

  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      regionId: true,
    },
  });

  if (!dbUser) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  if (req.method === 'GET') {
    if (!checkPermission(role, 'requests:read')) {
      return res.status(403).json({ message: 'Usuário não autorizado' });
    }

    const { filter } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (dbUser.regionId && dbUser.regionId !== 'dsau') {
      whereClause = {
        sender: {
          regionId: dbUser.regionId,
        },
      };
    }

    if (dbUser.organizationId) {
      whereClause = {
        senderId: dbUser.organizationId,
      };
    }

    if (filter === 'sent') {
      whereClause = {
        ...whereClause,
        OR: [
          {
            actions: {
              some: {
                userId,
              },
            },
            // Para solicitações enviadas, excluímos aquelas que estão aguardando ação do usuário atual
            status: {
              not: {
                in: Object.entries(statusTransitions)
                      .filter(([_, transition]) => transition?.requiredRole === role)
                      .map(([status]) => status as RequestStatus)
              }
            }
          },
          // Incluir solicitações que necessitam correção nas enviadas para o OPERADOR_FUSEX
          ...(role === 'OPERADOR_FUSEX' ? [{
            status: RequestStatus.NECESSITA_CORRECAO,
            senderId: dbUser.organizationId
          }] : [])
        ]
      };
    } else {
      // Para solicitações pendentes, incluímos apenas aquelas que precisam da ação do usuário atual
      whereClause = {
        ...whereClause,
        status: {
          in: Object.entries(statusTransitions)
                .filter(([_, transition]) => transition?.requiredRole === role)
                .map(([status]) => status as RequestStatus)
        },
        // Excluir NECESSITA_CORRECAO das pendentes para o OPERADOR_FUSEX
        ...(role === 'OPERADOR_FUSEX' ? {
          NOT: {
            status: RequestStatus.NECESSITA_CORRECAO
          }
        } : {})
      };
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return res.status(200).json(requests);
  }

  if (req.method === 'POST') {
    if (!checkPermission(role, 'requests:create')) {
      return res.status(403).json({ message: 'Usuário não autorizado' });
    }

    const formData = formidable({ multiples: true });
    const [fields, files] = await formData.parse(req);
    const formattedFields = Object.entries(fields).reduce(
      (acc, [key, value]) => {
        if (value === undefined) {
          return acc;
        }

        if (key.includes('[]')) {
          const formattedKey = key.replace('[]', '');
          return {
            ...acc,
            [formattedKey]: JSON.parse(value[0]),
          };
        }

        if (value[0] === 'true' || value[0] === 'false') {
          return {
            ...acc,
            [key]: value[0] === 'true',
          };
        }

        return { ...acc, [key]: value[0] };
      },
      {} as any,
    );

    const {
      cpf,
      needsCompanion,
      cbhpmCode,
      opmeCost,
      psaCost,
      requestedOrganizationIds,
    } = formattedFields;

    const request = await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.request.create({
        data: {
          needsCompanion,
          cbhpmCode,
          opmeCost: parseInt(opmeCost, 10),
          psaCost: parseInt(psaCost, 10),
          requestedOrganizationIds,
          pacient: {
            connect: {
              cpf,
            },
          },
          sender: {
            connect: {
              id: dbUser.organizationId as string,
            },
          },
        },
      });

      await tx.actionLog.create(
        logAction(
          userId,
          createdRequest.id,
          ActionType.CRIACAO,
          '',
          'request',
          files.files && files.files.length > 0
            ? files.files.map(
                (file) =>
                  `/public/arquivos/${createdRequest.id}/${file.originalFilename}`,
              )
            : undefined,
        ),
      );

      return createdRequest;
    });

    if (files.files && files.files.length > 0) {
      const uploadDir = path.join(
        process.cwd(),
        `/public/arquivos/${request.id}`,
      );

      files.files.forEach((file) => {
        const oldPath = file.filepath;
        const newPath = path.join(uploadDir, file.originalFilename as string);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.renameSync(oldPath, newPath);
      });
    }

    return res.status(201).json(request);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
