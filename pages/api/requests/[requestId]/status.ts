import logAction from "@/log-action";
import {
  checkPermission,
  statusTransitions,
  terminalStatuses,
  UserType,
  getNextStatusAfterChem2,
} from "@/permissions/utils";
import { auth } from "../../../../auth";
import prisma from "../../../../prisma/prismaClient";
import { ActionType, RequestStatus, Role, Prisma } from "@prisma/client";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import { generateSequentialToken } from "@/utils/tokenGenerator";

type CreateRequestResponseInput = {
  requestId: string;
  receiverId: string;
};

async function createRequestResponse(
  tx: Prisma.TransactionClient,
  data: CreateRequestResponseInput
) {
  const { requestId, receiverId } = data;
  return tx.requestResponse.create({
    data: {
      request: {
        connect: { id: requestId },
      },
      receiver: {
        connect: { id: receiverId },
      },
    },
  });
}

function getNextStatus(currentStatus: RequestStatus, userRole: Role) {
  if (!statusTransitions[currentStatus]) {
    return "unauthorized";
  }

  // Se é OPERADOR_FUSEX, pode avançar ou corrigir em certos pontos do fluxo
  if (userRole === Role.OPERADOR_FUSEX) {
    // Se está aguardando resposta do HOMOLOGADOR_SOLICITADA_1, pode avançar ou pedir correção
    if (currentStatus === RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_1) {
      return RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_1;
    }
  }
  
  // Para CHEFE_SECAO_REGIONAL_3, verificamos se o papel do usuário é o correto
  if (currentStatus === RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3 && userRole === Role.CHEFE_SECAO_REGIONAL) {
    return statusTransitions[currentStatus]?.nextStatus || "unauthorized";
  }

  // Se está em NECESSITA_CORRECAO, pode enviar para o próximo status
  if (currentStatus === RequestStatus.NECESSITA_CORRECAO) {
    // Se for OPERADOR_FUSEX, volta para o CHEFE_FUSEX_1
    if (userRole === Role.OPERADOR_FUSEX) {
      return RequestStatus.AGUARDANDO_CHEFE_FUSEX_1;
    }

    // Para outros usuários, encontra o próximo status baseado no papel
    const currentTransition = Object.entries(statusTransitions).find(
      ([_, transition]) => transition?.requiredRole === userRole
    );

    if (currentTransition) {
      const currentStatus = currentTransition[0] as RequestStatus;
      const nextTransition = statusTransitions[currentStatus];
      
      if (nextTransition) {
        return nextTransition.nextStatus;
      }
    }
  }

  const { nextStatus, requiredRole } = statusTransitions[currentStatus] as {
    nextStatus: RequestStatus;
    previousStatus: RequestStatus | null;
    requiredRole: Role;
  };

  if (requiredRole !== userRole) {
    return "unauthorized";
  }

  return nextStatus;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await auth(req, res);
  const { userId, role } = session?.user as UserType;
  const { requestId } = req.query;

  if (!session?.user || !role) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  const request = await prisma.request.findUnique({
    where: {
      id: requestId as string,
    },
    select: {
      id: true,
      status: true,
      senderId: true,
      requestedOrganizationIds: true,
      sender: {
        select: {
          regionId: true,
        },
      },
      requestResponses: {
        select: {
          id: true,
          status: true,
          selected: true,
          receiver: {
            select: {
              regionId: true,
            },
          },
        },
      },
    },
  });

  if (!request) {
    return res.status(404).json({ message: "Solicitação não encontrada" });
  }

  let nextStatus: RequestStatus | "unauthorized" = getNextStatus(
    request.status,
    role
  );

  const formData = formidable({ multiples: true });
  const [fields, files] = await formData.parse(req);
  const formattedFields = Object.entries(fields).reduce((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }

    if (key.includes("[]")) {
      const formattedKey = key.replace("[]", "");
      return {
        ...acc,
        [formattedKey]: JSON.parse(value[0]),
      };
    }

    if (value[0] === "true" || value[0] === "false") {
      return {
        ...acc,
        [key]: value[0] === "true",
      };
    }

    return { ...acc, [key]: value[0] };
  }, {} as any);

  if (req.method === "PATCH") {
    const {
      favorable,
      correction = false,
      cancel = false,
      observation,
      ticketCosts,
      cancelUnfinishedResponses,
    } = formattedFields;    // Caso especial para cancelamento pelo OPERADOR_FUSEX
    if (cancel && role === Role.OPERADOR_FUSEX) {
      // Verificamos apenas se o OPERADOR_FUSEX tem permissão de atualização
      if (!checkPermission(role, "requests:update")) {
        return res.status(403).json({ message: "Usuário não autorizado" });
      }

      // Verificar se a solicitação já está em um estado final
      const finalStatuses = [
        RequestStatus.CANCELADO,
        RequestStatus.APROVADO,
        RequestStatus.REPROVADO,
        RequestStatus.REPROVADO_DSAU,
        RequestStatus.FINALIZADO
      ];

      if (finalStatuses.includes(request.status)) {
        return res.status(400).json({ 
          message: "Não é possível cancelar uma solicitação que já foi finalizada" 
        });
      }

      await prisma.$transaction(async (tx) => {
        // Cancelar todas as respostas ativas
        await tx.requestResponse.updateMany({
          where: {
            requestId: requestId as string,
            status: {
              notIn: [
                RequestStatus.CANCELADO,
                RequestStatus.APROVADO,
                RequestStatus.REPROVADO,
                RequestStatus.REPROVADO_DSAU,
              ]
            }
          },
          data: {
            status: RequestStatus.CANCELADO
          }
        });

        // Registrar a ação de cancelamento
        await tx.actionLog.create(
          logAction(
            userId,
            requestId as string,
            ActionType.CANCELAMENTO,
            observation || "Solicitação cancelada pelo Operador FUSEX",
            "request",
            files.files && files.files.length > 0
              ? files.files.map(
                  (file) =>
                    `/public/arquivos/${requestId}/${file.originalFilename}`
                )
              : undefined
          )
        );

        // Atualizar o status da solicitação para CANCELADO
        await tx.request.update({
          where: {
            id: requestId as string,
          },
          data: {
            status: RequestStatus.CANCELADO,
          },
        });
      });

      return res.status(200).json(undefined);
    }

    // Para os outros casos, verificamos se o usuário está autorizado pelo status atual
    if (nextStatus === "unauthorized") {
      return res.status(403).json({ message: "Usuário não autorizado" });
    }

    if (!checkPermission(role, "requests:update")) {
      return res.status(403).json({ message: "Usuário não autorizado" });
    }

    if (files.files && files.files.length > 0) {
      const uploadDir = path.join(
        process.cwd(),
        `/public/arquivos/${requestId}`
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

      // Já tratamos o cancelamento acima, então removemos esta seção
      
      if (correction) {
        await prisma.$transaction([
          prisma.actionLog.create(
            logAction(
              userId,
              requestId as string,
              ActionType.REPROVACAO,
              observation || "Enviado para correção",
              "request",
              files.files && files.files.length > 0
                ? files.files.map(
                    (file) =>
                      `/public/arquivos/${requestId}/${file.originalFilename}`
                  )
                : undefined
            )
          ),
          prisma.request.update({
            where: {
              id: requestId as string,
            },
            data: {
              status: RequestStatus.NECESSITA_CORRECAO,
            },
          })
        ]);
        return res.status(200).json(undefined);
      }    if (!favorable) {
      const promises = [
        prisma.requestResponse.update({
          where: {
            id: request.requestResponses.find((response) => response.selected)
              ?.id,
          },
          data: {
            selected: false,
            status: RequestStatus.REPROVADO_DSAU,
          },
        }),
        prisma.request.update({
          where: {
            id: requestId as string,
          },
          data: {
            status: getNextStatus(
              RequestStatus.REPROVADO_DSAU,
              role
            ) as RequestStatus,
          },
        }),
      ];

      await prisma.$transaction([
        prisma.actionLog.create(
          logAction(
            userId,
            requestId as string,
            ActionType.REPROVACAO,
            observation,
            "request",
            files.files && files.files.length > 0
              ? files.files.map(
                  (file) =>
                    `/public/arquivos/${requestId}/${file.originalFilename}`
                )
              : undefined
          )
        ),
        ...promises,
      ]);      return res.status(200).json(undefined);
    }

    // Para CHEM_2, determinar o próximo status baseado na comparação das regiões militares
    if (request.status === RequestStatus.AGUARDANDO_CHEM_2) {
      // Buscar as organizações de destino para obter suas regiões
      const destinationOrganizations = await prisma.organization.findMany({
        where: {
          id: {
            in: request.requestedOrganizationIds,
          },
        },
        select: {
          id: true,
          regionId: true,
        },
      });
      
      const destinationRegionIds = destinationOrganizations.map(org => org.regionId);
      
      // Usar a função helper para determinar o próximo status
      nextStatus = getNextStatusAfterChem2(request.sender.regionId, destinationRegionIds);
      
      console.log(`CHEM_2 Decision: Origin RM=${request.sender.regionId}, Destination RMs=[${destinationRegionIds.join(', ')}] -> Next Status: ${nextStatus}`);
    }

    // Tratamento para CHEM_2 - configurar a response correta baseado no próximo status determinado
    if (request.status === RequestStatus.AGUARDANDO_CHEM_2) {
      // Se o próximo status é CHEFE_DIV_MEDICINA_4 (RM iguais), configurar organizações de destino
      if (nextStatus === RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4 && request.requestedOrganizationIds && request.requestedOrganizationIds.length > 0) {
        console.log('Configurando resposta para CHEFE_DIV_MEDICINA_4 nas organizações de destino:', request.requestedOrganizationIds);
        
        // Buscar as organizações de destino que tenham usuários CHEFE_DIV_MEDICINA
        const destinationOrganizations = await prisma.organization.findMany({
          where: {
            id: {
              in: request.requestedOrganizationIds,
            },
          },
          select: {
            id: true,
            name: true,
            users: {
              where: {
                role: Role.CHEFE_DIV_MEDICINA
              },
              select: {
                id: true
              }
            }
          }
        });
        
        // Encontrar a primeira organização de destino com usuários CHEFE_DIV_MEDICINA
        const destinationOrg = destinationOrganizations.find(org => org.users.length > 0);
        
        if (destinationOrg) {
          console.log('Configurando organização de destino para CHEFE_DIV_MEDICINA_4:', destinationOrg.name);
          
          // Buscar ou criar uma resposta para a organização de destino
          let destResponse = await prisma.requestResponse.findFirst({
            where: {
              requestId: requestId as string,
              receiverId: destinationOrg.id,
            },
          });
          
          // Se não existir, criar uma nova resposta para a organização de destino
          if (!destResponse) {
            destResponse = await prisma.requestResponse.create({
              data: {
                requestId: requestId as string,
                receiverId: destinationOrg.id,
                selected: false,
                status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4,
              },
            });
          }
          
          // Desmarcar todas as respostas anteriores
          await prisma.requestResponse.updateMany({
            where: {
              requestId: requestId as string,
            },
            data: {
              selected: false,
            },
          });
          
          // Marcar apenas a resposta da organização de destino como selecionada
          await prisma.requestResponse.update({
            where: { id: destResponse.id },
            data: { 
              selected: true,
              status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4,
            },
          });
          
          // Atualizar o status de todas as outras respostas para AGUARDANDO_CHEFE_DIV_MEDICINA_4
          await prisma.requestResponse.updateMany({
            where: {
              requestId: requestId as string,
              NOT: {
                id: destResponse.id
              }
            },
            data: {
              status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4
            },
          });
          
          console.log(`Solicitação ${requestId} configurada para aparecer apenas para CHEFE_DIV_MEDICINA da organização ${destinationOrg.name}`);        } else {
          console.log('Nenhuma organização de destino possui usuários CHEFE_DIV_MEDICINA:', request.requestedOrganizationIds);
          
          // Fallback: se nenhuma organização de destino tem CHEFE_DIV_MEDICINA,
          // priorizar organizações de destino que NÃO sejam a organização remetente
          const destinationOrgsExcludingSender = request.requestedOrganizationIds.filter(
            orgId => orgId !== request.senderId
          );
          
          // Se houver organizações de destino diferentes da remetente, usar a primeira
          // Caso contrário, usar a primeira da lista original (cenário raro onde só há a org remetente)
          const targetOrgId = destinationOrgsExcludingSender.length > 0 
            ? destinationOrgsExcludingSender[0] 
            : request.requestedOrganizationIds[0];
          
          console.log(`Fallback: Usando organização ${targetOrgId} (remetente: ${request.senderId})`);
          
          let fallbackResponse = await prisma.requestResponse.findFirst({
            where: {
              requestId: requestId as string,
              receiverId: targetOrgId,
            },
          });
          
          if (!fallbackResponse) {
            fallbackResponse = await prisma.requestResponse.create({
              data: {
                requestId: requestId as string,
                receiverId: targetOrgId,
                selected: false,
                status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4,
              },
            });
          }
          
          // Desmarcar todas as respostas
          await prisma.requestResponse.updateMany({
            where: {
              requestId: requestId as string,
            },
            data: {
              selected: false,
            },
          });
          
          // Marcar apenas a resposta da organização de destino (não remetente)
          await prisma.requestResponse.update({
            where: { id: fallbackResponse.id },
            data: { 
              selected: true,
              status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4,
            },
          });
          
          // Buscar o nome da organização para logging
          const targetOrg = await prisma.organization.findUnique({
            where: { id: targetOrgId },
            select: { name: true }
          });
          
          console.log(`Fallback: Solicitação ${requestId} configurada para organização ${targetOrg?.name || 'desconhecida'} (${targetOrgId})`);
        }
      } else if (nextStatus === RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_1) {
        // Se vai para o fluxo DSAU (RM diferentes), não precisa configurar organizações específicas
        console.log('CHEM_2: Direcionando para fluxo DSAU (RM diferentes)');
      } else {
        console.log('Solicitação não possui organizações de destino definidas (requestedOrganizationIds vazio)');
      }
    }    // Para CHEFE_SECAO_REGIONAL_3, sempre direcionar para AGUARDANDO_OPERADOR_FUSEX_REALIZACAO (RM iguais)
    if (request.status === RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3) {
      // Definimos o próximo status diretamente para operador FUSEX (realização)
      nextStatus = RequestStatus.AGUARDANDO_OPERADOR_FUSEX_REALIZACAO;
    }    await prisma.$transaction(async (tx) => {
      // Gerar token sequencial em dois cenários:
      // 1. RM IGUAIS: CHEFE_SECAO_REGIONAL_3 → OPERADOR_FUSEX_REALIZACAO
      // 2. RM DIFERENTES: SUBDIRETOR_SAUDE_2 → CHEFE_DIV_MEDICINA_4 (aprovação final DSAU)
      let tokenSequencial: string | undefined;
      
      if (
        (request.status === RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3 &&
         nextStatus === RequestStatus.AGUARDANDO_OPERADOR_FUSEX_REALIZACAO) ||
        (request.status === RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_2 &&
         nextStatus === RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4)
      ) {
        // Busca a região da organização remetente para gerar o token
        const senderOrg = await tx.organization.findUnique({
          where: { id: request.senderId },
          include: { region: true }
        });

        if (senderOrg?.region) {
          tokenSequencial = await generateSequentialToken(tx, senderOrg.region.id);
          const cenario = request.status === RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3 
            ? "RM iguais - Chefe Seção Regional" 
            : "RM diferentes - Subdiretor Saúde";
          console.log(`🎫 Token sequencial gerado: ${tokenSequencial} para solicitação ${requestId} (${cenario})`);
        }
      }

      // Criando as responses vazias uma vez que mandou para as solicitadas
      if (
        request.status === RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_1
      ) {
        const responsePromises = request.requestedOrganizationIds.map(
          (receiverId) =>
            createRequestResponse(tx, {
              requestId: requestId as string,
              receiverId,
            })
        );
        await Promise.all(responsePromises);
      } else {
        await tx.actionLog.create(
          logAction(
            userId,
            requestId as string,
            ActionType.APROVACAO,
            observation,
            "request",
            files.files && files.files.length > 0
              ? files.files.map(
                  (file) =>
                    `/public/arquivos/${requestId}/${file.originalFilename}`
                )
              : undefined
          )
        );
      }

      // Atualizar o status da solicitação principal
      await tx.request.update({
        where: {
          id: requestId as string,
        },
        data: {
          status: nextStatus as RequestStatus,
          tokenSequencial: tokenSequencial, // Adiciona o token se foi gerado
        },
      });
        // Se estamos atualizando para um status de AGUARDANDO_CHEFE_DIV_MEDICINA_4, atualizar TODAS
      // as respostas para o mesmo status (não apenas as selecionadas), pois elas precisam
      // refletir o novo estado da solicitação
      if (nextStatus === RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4) {
        console.log(`🔧 Atualizando TODAS as responses para status AGUARDANDO_CHEFE_DIV_MEDICINA_4 (Request: ${requestId})`);
        
        await tx.requestResponse.updateMany({
          where: {
            requestId: requestId as string
          },
          data: {
            status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4
          }
        });
      }
    });

    return res.status(200).json(undefined);
  }

  return res.status(405).json({ message: "Método não permitido" });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
