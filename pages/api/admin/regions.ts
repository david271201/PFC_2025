import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticação
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const user = session.user as UserType;
  
  // Verificar se o usuário é Subdiretor de Saúde
  if (user.role !== Role.SUBDIRETOR_SAUDE) {
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }

  // Métodos GET para listar todas as regiões
  if (req.method === 'GET') {
    try {
      const regions = await prisma.region.findMany({
        orderBy: {
          name: 'asc'
        }
      });

      return res.status(200).json(regions);
    } catch (error) {
      console.error('Erro ao buscar regiões:', error);
      return res.status(500).json({
        message: 'Erro ao buscar regiões'
      });
    }
  }
  // Método não permitido
  else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
