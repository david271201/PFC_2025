import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma/prismaClient';
import { checkPermission, UserType } from '@/permissions/utils';
import { auth } from '@@/auth';
import { RequestStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Autenticação
  const session = await auth(req, res);
  const { userId, role } = session?.user as UserType;

  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  if (!checkPermission(role, 'requests:create')) {
    return res.status(403).json({ message: 'Usuário não autorizado' });
  }

  const { requestId } = req.body;
  
  // Garantir que estamos trabalhando com uma string
  const actualRequestId = Array.isArray(requestId) ? requestId[0] : requestId;

  if (!actualRequestId) {
    return res.status(400).json({ message: 'ID da solicitação não fornecido' });
  }

  try {
    // Verificar se a solicitação já existe
    const existingRequest = await prisma.request.findUnique({
      where: { id: actualRequestId }
    });

    if (existingRequest) {
      return res.status(200).json({ 
        message: 'Solicitação já existe',
        request: existingRequest
      });
    }

    // Obter a organização do usuário
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true
      }
    });

    if (!dbUser || !dbUser.organizationId) {
      return res.status(400).json({ message: 'Usuário sem organização definida' });
    }

    // Obter o primeiro paciente disponível
    const pacient = await prisma.pacient.findFirst();

    if (!pacient) {
      return res.status(404).json({ message: 'Nenhum paciente encontrado para criar a solicitação' });
    }

    // Criar a solicitação com o ID específico
    const newRequest = await prisma.request.create({
      data: {
        id: actualRequestId,
        description: 'Solicitação de teste para formulário',
        pacientCpf: pacient.cpf,
        senderId: dbUser.organizationId,
        requestedOrganizationIds: [dbUser.organizationId],
        cbhpmCode: '12345',
        needsCompanion: false,
        opmeCost: 0,
        status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_1
      }
    });

    return res.status(201).json({
      message: 'Solicitação criada com sucesso',
      request: newRequest
    });
  } catch (error) {
    console.error('Erro ao criar solicitação de teste:', error);
    return res.status(500).json({ message: 'Erro ao criar solicitação de teste' });
  }
}
