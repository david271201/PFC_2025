import logAction from '@/log-action';
import { checkPermission, UserType, statusTransitions } from '@/permissions/utils';
import { isStatusForRole } from '@/utils';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
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
      // Tratamento especial para CHEFE_SECAO_REGIONAL_3
      if (role === 'CHEFE_SECAO_REGIONAL' && dbUser.organizationId) {
        // Para solicitações AGUARDANDO_CHEFE_SECAO_REGIONAL_3, só mostrar se a organização do usuário
        // for a receptora
        whereClause = {
          OR: [
            // Opção 1: Status da solicitação é AGUARDANDO_CHEFE_SECAO_REGIONAL_3
            // e a organização do usuário é a receptora e o status da resposta é correto
            {
              status: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3,
              requestResponses: {
                some: {
                  receiverId: dbUser.organizationId,
                  status: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3
                }
              }
            },
            // Opção 2: Backup - Status da solicitação é AGUARDANDO_CHEFE_SECAO_REGIONAL_3
            // independente do status da resposta (para garantir que mostre mesmo se houver inconsistência)
            {
              status: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3,
              requestResponses: {
                some: {
                  receiverId: dbUser.organizationId
                }
              }
            }
          ]
        };
        
        console.log("Filtro para CHEFE_SECAO_REGIONAL_3:", JSON.stringify(whereClause, null, 2));
        
        // Log detalhado para depuração do status CHEFE_SECAO_REGIONAL_3
        const debugRequests = await prisma.request.findMany({
          where: {
            status: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3
          },
          include: {
            requestResponses: {
              where: {
                receiverId: dbUser.organizationId
              },
              select: {
                id: true,
                selected: true,
                status: true,
                receiverId: true
              }
            }
          }
        });
        
        console.log(`DEBUG: Encontradas ${debugRequests.length} solicitações com status AGUARDANDO_CHEFE_SECAO_REGIONAL_3`);
        debugRequests.forEach(req => {
          console.log(`- Request ${req.id}, status: ${req.status}, respostas para org ${dbUser.organizationId}:`, 
            req.requestResponses.map(r => `${r.id} (selected: ${r.selected}, status: ${r.status})`));
        });
      } else {
        // Para outros papéis, usamos a lógica original
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
        
        // Log para CHEFE_DIV_MEDICINA para debug
        if (role === 'CHEFE_DIV_MEDICINA') {
          console.log("Usando lógica padrão para CHEFE_DIV_MEDICINA - whereClause:", JSON.stringify(whereClause, null, 2));
        }
      }
    }

    // Adicionar campos para depuração em ambientes de desenvolvimento
    const isDevEnv = process.env.NODE_ENV === 'development';
    
    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        requestResponses: {
          where: {
            selected: true
          },
          select: {
            id: true,
            receiverId: true,
            selected: true,
            receiver: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Log para ajudar na depuração
    if (isDevEnv && role === 'CHEFE_DIV_MEDICINA') {
      console.log(`Solicitações para CHEFE_DIV_MEDICINA (org ${dbUser.organizationId}):`);
      requests.forEach(req => {
        const selectedResponse = req.requestResponses?.[0];
        console.log(`- Request ${req.id}, status: ${req.status}, org receptora: ${selectedResponse?.receiver?.name} (${selectedResponse?.receiverId})`);
      });
    }

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
          opmeCost: parseFloat(opmeCost) || 0, // Parse as float for decimal values
          psaCost: parseFloat(psaCost) || 0, // Parse as float for decimal values
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
