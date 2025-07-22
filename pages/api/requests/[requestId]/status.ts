import logAction from "@/log-action";
import {
  checkPermission,
  statusTransitions,
  terminalStatuses,
  UserType,
} from "@/permissions/utils";
import { auth } from "@@/auth";
import prisma from "@@/prisma/prismaClient";
import { ActionType, RequestStatus, Role, Prisma } from "@prisma/client";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

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

  // Se está em NECESSITA_CORRECAO, procurar o próximo status após a correção
  if (currentStatus === RequestStatus.NECESSITA_CORRECAO) {
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
    } = formattedFields;

    // Caso especial para cancelamento pelo OPERADOR_FUSEX
    if (cancel && role === Role.OPERADOR_FUSEX) {
      // Verificamos apenas se o OPERADOR_FUSEX tem permissão de atualização
      if (!checkPermission(role, "requests:update")) {
        return res.status(403).json({ message: "Usuário não autorizado" });
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
      ]);

      return res.status(200).json(undefined);
    }

    // Checar se as OM são da mesma região militar ou não para ver se precisa mandar para DSau
    if (request.status === RequestStatus.AGUARDANDO_CHEM_2) {
      const selectedResponse = await prisma.requestResponse.findUnique({
        where: {
          id: request.requestResponses.find((response) => response.selected)
            ?.id,
        },
        select: {
          receiver: {
            select: {
              regionId: true,
            },
          },
        },
      });

      if (!selectedResponse) {
        return res.status(400).json({
          message: "Nenhuma OM selecionada",
        });
      }

      if (selectedResponse.receiver.regionId === request.sender.regionId) {
        nextStatus = RequestStatus.APROVADO;
      }
    }

    await prisma.$transaction(async (tx) => {
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

      await tx.request.update({
        where: {
          id: requestId as string,
        },
        data: {
          status: nextStatus as RequestStatus,
        },
      });
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
