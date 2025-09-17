import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';
import { Role } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar a sessão do usuário
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  // Verificar se o usuário é CHEFE_DIV_MEDICINA e extrair o userId corretamente
  console.log('Sessão do usuário na API de avaliação:', JSON.stringify(session.user, null, 2));
  
  // Extrair corretamente o userId e role
  const userRole = (session.user as any).role;
  const userId = (session.user as any).userId;
  
  if (userRole !== Role.CHEFE_DIV_MEDICINA) {
    return res.status(403).json({ message: 'Usuário sem permissão para esta ação' });
  }
  
  console.log('ID do usuário na API de avaliação:', userId);

  if (req.method === 'POST') {
    try {
      const { requestId, formularioId } = req.body;

      if (!requestId) {
        return res.status(400).json({ message: 'ID da solicitação não fornecido' });
      }

      // Verificar se a solicitação existe e está no status esperado
      const request = await prisma.request.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Garantir que o userId existe antes de continuar
      if (!userId) {
        console.error('ID do usuário não encontrado na sessão');
        return res.status(401).json({ message: 'ID do usuário não encontrado na sessão' });
      }
      
      // Atualizar o status da solicitação para o próximo na sequência
      const updatedRequest = await prisma.$transaction(async (tx) => {
        // Atualizar status da solicitação
        const updated = await tx.request.update({
          where: { id: requestId },
          data: {
            status: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3',
            updatedAt: new Date()
          }
        });

        // Registrar a ação com verificação prévia
        console.log('Tentando criar ActionLog com:', {
          requestId,
          userId,
          action: 'APROVACAO'
        });
        
        // Verificar se o usuário existe
        const userExists = await tx.user.findUnique({
          where: { id: userId as string },
          select: { id: true }
        });
        
        if (!userExists) {
          throw new Error(`Usuário com ID ${userId} não encontrado`);
        }
        
        await tx.actionLog.create({
          data: {
            requestId,
            userId: userId as string,
            action: 'APROVACAO',
            observation: `Formulário médico avaliado pelo Chefe de Divisão de Medicina. ID do formulário: ${formularioId || 'N/A'}`,
            files: []
          }
        });

        return updated;
      });

      return res.status(200).json({
        message: 'Avaliação do Chefe de Divisão de Medicina registrada com sucesso',
        requestId,
        formularioId,
        newStatus: updatedRequest.status
      });
    } catch (error) {
      console.error('Erro ao processar avaliação do Chefe de Divisão de Medicina:', error);
      return res.status(500).json({
        message: 'Erro ao processar avaliação'
      });
    }
  } else {
    // Método não permitido
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
