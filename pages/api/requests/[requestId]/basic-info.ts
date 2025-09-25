import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../prisma/prismaClient';
import { auth } from '../../../../auth';
import { UserType } from '@/permissions/utils';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await auth(req, res);
  const { requestId } = req.query;

  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  if (req.method === 'GET') {
    try {
      // Buscar dados básicos da solicitação com informações do paciente
      const request = await prisma.request.findUnique({
        where: {
          id: requestId as string,
        },
        select: {
          id: true,
          description: true,
          needsCompanion: true,
          cbhpmCode: true,
          pacient: {
            select: {
              cpf: true,
              precCp: true,
              name: true,
              rank: true,
              isDependent: true,
            },
          },
          formulariosRegistrados: {
            select: {
              id: true,
              consultaExame: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Pegar apenas o mais recente
          },
        },
      });

      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      return res.status(200).json(request);
    } catch (error) {
      console.error('Erro ao buscar dados básicos da solicitação:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  } else {
    return res.status(405).json({ message: 'Método não permitido' });
  }
}