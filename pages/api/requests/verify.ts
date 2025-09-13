import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma/prismaClient';

// Função para verificar se uma solicitação existe
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { requestId } = req.query;
  
  // Ajustando para lidar com arrays (Next.js às vezes envia parâmetros como arrays)
  const actualRequestId = Array.isArray(requestId) ? requestId[0] : requestId;

  if (!actualRequestId || typeof actualRequestId !== 'string') {
    return res.status(400).json({ message: 'ID de solicitação não fornecido ou inválido' });
  }

  try {
    // Verifica se a solicitação existe
    const request = await prisma.request.findUnique({
      where: {
        id: actualRequestId
      },
      select: {
        id: true,
        description: true,
        status: true,
        pacient: {
          select: {
            name: true,
            cpf: true,
            precCp: true,
            rank: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    return res.status(200).json({ exists: true, request });
  } catch (error) {
    console.error('Erro ao verificar solicitação:', error);
    return res.status(500).json({ message: 'Erro ao verificar a solicitação' });
  }
}
