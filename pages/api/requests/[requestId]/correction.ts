import logAction from "@/log-action";
import { checkPermission, statusTransitions, UserType } from "@/permissions/utils";
import { auth } from "@@/auth";
import prisma from "@@/prisma/prismaClient";
import { ActionType, RequestStatus, Role } from "@prisma/client";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const session = await auth(req, res);
  const { userId, role } = session?.user as UserType;

  if (!session?.user || !role) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  const { requestId } = req.query;

  const request = await prisma.request.findUnique({
    where: {
      id: requestId as string,
    },
    include: {
      actions: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        where: {
          action: ActionType.REPROVACAO
        }
      }
    }
  });

  if (!request) {
    return res.status(404).json({ message: "Solicitação não encontrada" });
  }

  // Se está enviando uma correção, permitir qualquer agente do fluxo fazer a correção
  if (request.status === RequestStatus.NECESSITA_CORRECAO) {
    if (!checkPermission(role, "requests:update")) {
      return res.status(403).json({ message: "Usuário não autorizado" });
    }
  } else {
    // Se está solicitando uma correção, verificar se o usuário tem permissão no fluxo atual
    const currentTransition = statusTransitions[request.status];
    if (!currentTransition || currentTransition.requiredRole !== role) {
      return res.status(403).json({ message: "Usuário não autorizado neste ponto do fluxo" });
    }
  }

  const formData = formidable({ multiples: true });
  const [fields, files] = await formData.parse(req);
  const observation = fields.observation?.[0];

  // Se está enviando uma correção
  if (request.status === RequestStatus.NECESSITA_CORRECAO) {
    const lastAction = request.actions[0];
    if (!lastAction) {
      return res.status(400).json({ message: "Histórico de ações não encontrado" });
    }

    // Encontrar o usuário que solicitou a correção
    const lastUser = await prisma.user.findUnique({
      where: { id: lastAction.userId },
      select: { role: true }
    });

    if (!lastUser) {
      return res.status(400).json({ message: "Usuário que solicitou correção não encontrado" });
    }

    // O status de retorno será aquele onde o usuário que pediu a correção atua
    let returnStatus: RequestStatus;

    const lastActionEntry = Object.entries(statusTransitions).find(
      ([status, transition]) => 
        transition?.requiredRole === lastUser.role &&
        request.actions.some(action => action.action === ActionType.REPROVACAO)
    );

    if (!lastActionEntry) {
      // Se não encontrar, voltar para o início do fluxo
      returnStatus = RequestStatus.AGUARDANDO_CHEFE_FUSEX_1;
    } else {
      returnStatus = lastActionEntry[0] as RequestStatus;
    }

    await prisma.$transaction(async (tx) => {
      await tx.actionLog.create(
        logAction(
          userId,
          requestId as string,
          ActionType.APROVACAO,
          observation || "Correção enviada",
          "request",
          files.files && files.files.length > 0
            ? files.files.map(
                (file) =>
                  `/public/arquivos/${requestId}/${file.originalFilename}`
              )
            : undefined
        )
      );

      await tx.request.update({
        where: {
          id: requestId as string,
        },
        data: {
          status: returnStatus,
        },
      });
    });

    return res.status(200).json(undefined);
  }

  // Se está solicitando uma correção
  const currentTransition = statusTransitions[request.status];
  
  // Permitir que qualquer pessoa no fluxo possa solicitar correção
  await prisma.$transaction(async (tx) => {
    await tx.actionLog.create(
      logAction(
        userId,
        requestId as string,
        ActionType.REPROVACAO,
        observation || "Necessita correção",
        "request",
        files.files && files.files.length > 0
          ? files.files.map(
              (file) =>
                `/public/arquivos/${requestId}/${file.originalFilename}`
            )
          : undefined
      )
    );

    await tx.request.update({
      where: {
        id: requestId as string,
      },
      data: {
        status: RequestStatus.NECESSITA_CORRECAO,
      },
    });
  });

  return res.status(200).json(undefined);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
