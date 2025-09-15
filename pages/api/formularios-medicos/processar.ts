import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { RequestStatus } from '@prisma/client';
import { UserType } from '@/permissions/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  // Obter ID do usuário da sessão
  const { id: userId, role } = session.user as UserType;

  if (req.method === 'POST') {
    try {
      // Extrair dados do corpo da requisição
      const { requestId, parte, formularioId } = req.body;

      if (!requestId || !parte || !formularioId) {
        return res.status(400).json({ 
          message: 'Parâmetros incompletos', 
          success: false 
        });
      }

      // Verificar se a solicitação existe
      const request = await prisma.request.findUnique({
        where: { id: requestId }
      });
      
      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada', success: false });
      }

      // Atualizar status da solicitação com base no tipo de formulário
      let novoStatus;
      
      if (parte === 'OMS_DESTINO') {
        novoStatus = RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_1;
      } else if (parte === 'RM_DESTINO') {
        novoStatus = RequestStatus.APROVADO;
      } else {
        return res.status(400).json({ message: 'Tipo de formulário inválido', success: false });
      }
      
      // Atualizar o status da solicitação
      await prisma.request.update({
        where: { id: requestId },
        data: { status: novoStatus }
      });
      
      // Registrar ação de atualização de status
      await prisma.actionLog.create({
        data: {
          requestId,
          userId: userId as string,
          action: 'APROVACAO',
          observation: `Status atualizado para ${novoStatus} após preenchimento do formulário ${parte}`
        }
      });
      
      // Responder com sucesso
      return res.status(200).json({ 
        message: 'Formulário processado e status da solicitação atualizado',
        success: true,
        newStatus: novoStatus
      });
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      return res.status(500).json({ message: 'Erro ao processar formulário', success: false });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
