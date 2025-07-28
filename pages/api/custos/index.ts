import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await auth(req, res);
  const { userId, role } = session?.user as UserType;

  // Verificar se o usuário está autenticado
  if (!session?.user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const custos = await prisma.custo.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return res.status(200).json(custos);
    } catch (error) {
      console.error('Erro ao buscar custos:', error);
      return res.status(500).json({ message: 'Erro ao buscar custos' });
    }
  }

  if (req.method === 'POST') {
    const { descricao, valor } = req.body;
    
    if (!descricao || !valor) {
      return res.status(400).json({ message: 'Descrição e valor são obrigatórios' });
    }

    try {
      const novoCusto = await prisma.custo.create({
        data: {
          descricao,
          valor,
          usuarioId: userId,
        },
      });
      
      return res.status(201).json(novoCusto);
    } catch (error) {
      console.error('Erro ao criar custo:', error);
      return res.status(500).json({ message: 'Erro ao criar custo' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'ID é obrigatório' });
    }

    try {
      await prisma.custo.delete({
        where: {
          id: String(id),
        },
      });
      
      return res.status(200).json({ message: 'Custo removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover custo:', error);
      return res.status(500).json({ message: 'Erro ao remover custo' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
