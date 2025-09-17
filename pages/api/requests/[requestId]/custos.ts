import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../../auth';
import prisma from '../../../../prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const user = session.user as UserType;
  
  // Verificar se o usuário é um operador FUSEX
  if (user.role !== Role.OPERADOR_FUSEX) {
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }

  const { requestId } = req.query;
  
  if (!requestId || Array.isArray(requestId)) {
    return res.status(400).json({ message: 'ID da solicitação inválido' });
  }

  if (req.method === 'GET') {
    try {
      // Buscar custos relacionados à solicitação
      const custos = await prisma.custo.findMany({
        where: {
          requestId: requestId
        },
        include: {
          usuario: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(200).json(custos);
    } catch (error) {
      console.error('Erro ao buscar custos:', error);
      return res.status(500).json({
        message: 'Erro ao buscar custos'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { descricao, valor } = req.body;
      
      // Verificar se os campos necessários foram fornecidos
      if (!descricao || typeof valor !== 'number') {
        return res.status(400).json({ message: 'Descrição e valor são obrigatórios' });
      }
      
      // Verificar se o request existe
      const request = await prisma.request.findUnique({
        where: { id: requestId }
      });
      
      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }
      
      // Verificar se o status da solicitação é o correto
      if (request.status !== 'AGUARDANDO_OPERADOR_FUSEX_CUSTOS') {
        return res.status(403).json({ 
          message: 'A solicitação não está na etapa correta para adicionar custos'
        });
      }
      
      // Criar o custo
      const custo = await prisma.custo.create({
        data: {
          descricao,
          valor,
          requestId,
          usuarioId: user.userId,
        }
      });
      
      return res.status(201).json(custo);
    } catch (error) {
      console.error('Erro ao criar custo:', error);
      return res.status(500).json({ message: 'Erro ao criar custo' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { custoId } = req.body;
      
      // Verificar se o ID do custo foi fornecido
      if (!custoId) {
        return res.status(400).json({ message: 'ID do custo é obrigatório' });
      }
      
      // Verificar se o custo existe e pertence a esta solicitação
      const custo = await prisma.custo.findFirst({
        where: { 
          id: custoId,
          requestId: requestId
        }
      });
      
      if (!custo) {
        return res.status(404).json({ message: 'Custo não encontrado' });
      }
      
      // Excluir o custo
      await prisma.custo.delete({
        where: { id: custoId }
      });
      
      return res.status(200).json({ message: 'Custo excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir custo:', error);
      return res.status(500).json({ message: 'Erro ao excluir custo' });
    }
  } else {
    // Método não permitido
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
