import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar a sessão do usuário
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  // Obter o ID da solicitação da URL
  const { requestId } = req.query;
  
  if (!requestId || Array.isArray(requestId)) {
    return res.status(400).json({ message: 'ID da solicitação inválido' });
  }

  if (req.method === 'GET') {
    try {
      // Verificar se a solicitação existe
      const request = await prisma.request.findUnique({
        where: { id: requestId },
      });
      
      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }
      
      // Buscar formulários relacionados à solicitação
      const formularios = await prisma.formularioMedico.findMany({
        where: {
          requestId: requestId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(200).json(formularios);
    } catch (error) {
      console.error('Erro ao buscar formulários médicos:', error);
      return res.status(500).json({
        message: 'Erro ao buscar formulários médicos'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
