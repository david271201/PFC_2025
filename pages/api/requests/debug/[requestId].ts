import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../prisma/prismaClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { requestId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    console.log('=== API /api/requests/debug/[requestId] ===');
    console.log('requestId recebido:', requestId);
    
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Buscar a solicitação sem filtros de permissão
    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
      include: {
        pacient: true,
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      console.log('DEBUG: Solicitação não encontrada com o ID:', requestId);
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    console.log('DEBUG: Solicitação encontrada:', {
      id: request.id,
      status: request.status,
      pacientName: request.pacient?.name,
      senderOrg: request.sender?.name,
    });

    return res.status(200).json({
      debug: true,
      message: 'Apenas para diagnóstico',
      request,
    });
  } catch (error) {
    console.error('Erro ao buscar solicitação para debug:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
