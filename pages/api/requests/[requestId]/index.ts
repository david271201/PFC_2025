/* eslint-disable @typescript-eslint/no-explicit-any */
import logAction from '@/log-action';
import { checkPermission, UserType } from '@/permissions/utils';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { ActionType, RequestStatus, Role } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await auth(req, res);
  const { userId, role } = session?.user as UserType;
  const { requestId } = req.query;

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
    // Adicionar logs para depuração
    console.log('=== API /api/requests/[requestId] ===');
    console.log('requestId recebido:', requestId);
    console.log('Tipo do requestId:', typeof requestId);
    console.log('Usuário:', { userId, role, organizationId: dbUser.organizationId, regionId: dbUser.regionId });
    
    if (!checkPermission(role, 'requests:read')) {
      return res.status(403).json({ message: 'Usuário não autorizado' });
    }

    const getFilters = () => {
      let responsesFilter: any = {};
      // TEMPORÁRIO: Remover o filtro de senderId para diagnóstico
      // let requestsFilter: any = {
      //   senderId: dbUser.organizationId,
      // };
      
      // Usar um filtro vazio temporariamente para diagnóstico
      let requestsFilter: any = {};

      if (dbUser.regionId) {
        if (dbUser.regionId !== 'dsau') {
          responsesFilter = {
            status: RequestStatus.APROVADO,
          };
        }
        // requestsFilter = {}; // Já está vazio acima
      }
      
      console.log('*** IMPORTANTE: Filtros temporariamente removidos para diagnóstico ***');

      return { responsesFilter, requestsFilter };
    };

    const { responsesFilter, requestsFilter } = getFilters();
    
    // Log para mostrar os filtros que serão aplicados
    console.log('Filtros que serão aplicados na consulta:');
    console.log('responsesFilter:', responsesFilter);
    console.log('requestsFilter:', requestsFilter);
    
    // Construir a cláusula where para melhor log
    const whereClause = {
      id: requestId as string,
      ...requestsFilter,
    };
    console.log('Cláusula WHERE completa:', whereClause);

    const request = await prisma.request.findUnique({
      where: whereClause,
      include: {
        pacient: true,
        sender: {
          select: {
            name: true,
          },
        },
        custos: {
          include: {
            usuario: {
              select: {
                name: true
              }
            }
          }
        },
        formulariosRegistrados: {
          select: {
            id: true,
            consultaExame: true,
            createdAt: true
          }
        },
        requestResponses: {
          where: responsesFilter,
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
              },
            },
            actions: {
              include: {
                user: {
                  include: {
                    organization: {
                      select: {
                        name: true,
                      },
                    },
                    region: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            selected: 'desc',
          },
        },
      },
    });

    if (!request) {
      console.log('Solicitação não encontrada com o ID:', requestId);
      
      // Verificar se a solicitação existe sem os filtros adicionais
      const checkRequest = await prisma.request.findUnique({
        where: { id: requestId as string },
        select: { id: true, status: true, senderId: true }
      });
      
      console.log('Verificação direta sem filtros adicionais:', checkRequest);
      
      if (checkRequest) {
        console.log('A solicitação existe, mas foi filtrada pelos critérios de permissão.');
        console.log('Status da solicitação:', checkRequest.status);
        console.log('SenderId da solicitação:', checkRequest.senderId);
        console.log('OrganizationId do usuário:', dbUser.organizationId);
      }
      
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }
    
    // Se chegou aqui, a solicitação foi encontrada
    console.log('Solicitação encontrada:', { 
      id: request.id, 
      status: request.status,
      pacientCpf: request.pacientCpf,
      senderId: request.senderId
    });

    const requestedOrganizations = await prisma.organization.findMany({
      where: {
        id: {
          in: request.requestedOrganizationIds,
        },
      },
    });

    const requestActions = await prisma.actionLog.findMany({
      where: {
        requestId: requestId as string,
      },
      include: {
        user: {
          include: {
            organization: {
              select: {
                name: true,
              },
            },
            region: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      ...request,
      requestResponses: request.requestResponses.map((response) => ({
        ...response,
        actions: response.actions.map((action) => ({
          ...action,
          userName: action.user.name as string,
          userRole: action.user.role.replaceAll('_', ' '),
          userOrganization:
            action.user.region?.name || action.user.organization?.name,
        })),
      })),
      requestedOrganizations: requestedOrganizations.map((org) => ({
        id: org.id,
        name: org.name,
      })),
      requestActions: requestActions.map((action) => ({
        ...action,
        userName: action.user.name as string,
        userRole: action.user.role.replaceAll('_', ' '),
        userOrganization:
          action.user.region?.name || action.user.organization?.name,
      })),
    });
  }

  if (req.method === 'DELETE') {
    if (!checkPermission(role, 'requests:delete')) {
      return res.status(403).json({ message: 'Usuário não autorizado' });
    }

    const { observation } = req.body;

    const [canceledRequest, _] = await prisma.$transaction([
      prisma.request.update({
        where: {
          id: requestId as string,
        },
        data: {
          status: RequestStatus.CANCELADO,
        },
      }),
      prisma.actionLog.create(
        logAction(
          userId,
          requestId as string,
          ActionType.CANCELAMENTO,
          observation,
        ),
      ),
    ]);

    return res.status(200).json(canceledRequest);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
