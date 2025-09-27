import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../../../auth';
import prisma from '../../../../../prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }

  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const user = session.user as UserType;
  
  // Verificar se o usuário é um operador FUSEX
  if (user.role !== Role.OPERADOR_FUSEX) {
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }

  const { requestId, custoId } = req.query;
  
  if (!requestId || Array.isArray(requestId) || !custoId || Array.isArray(custoId)) {
    return res.status(400).json({ message: 'IDs inválidos' });
  }

  try {
    // Verificar se o request existe e está na etapa correta
    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }
    
    // Verificar se o status da solicitação permite edição
    if (request.status !== 'AGUARDANDO_OPERADOR_FUSEX_REALIZACAO' && request.status !== 'AGUARDANDO_OPERADOR_FUSEX_CUSTOS') {
      return res.status(403).json({ 
        message: 'A solicitação não está na etapa correta para deletar custos'
      });
    }

    // Verificar se o custo existe e pertence à solicitação
    const custo = await prisma.custo.findFirst({
      where: {
        id: custoId,
        requestId: requestId
      }
    });

    if (!custo) {
      return res.status(404).json({ message: 'Custo não encontrado' });
    }

    // Verificar se o custo foi criado pelo usuário atual (opcional - por segurança)
    if (custo.usuarioId !== user.userId) {
      return res.status(403).json({ message: 'Você só pode deletar custos que você mesmo criou' });
    }

    // Deletar o custo
    await prisma.custo.delete({
      where: {
        id: custoId
      }
    });
    
    return res.status(200).json({ message: 'Custo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar custo:', error);
    return res.status(500).json({ message: 'Erro ao deletar custo' });
  }
}