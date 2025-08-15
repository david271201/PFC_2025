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

  // Obter ID e papel do usuário da sessão
  const { id: userId, role } = session.user as UserType;
  
  if (req.method === 'GET') {
    try {
      const { requestId } = req.query;
      
      if (!requestId || Array.isArray(requestId)) {
        return res.status(400).json({ message: 'ID da solicitação inválido' });
      }

      // Verificar se a solicitação existe
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: {
          pacient: true,
          sender: true,
          formulariosRegistrados: {
            where: {
              requestId: requestId
            }
          }
        }
      });
      
      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Verificar se o usuário é Chefe da Divisão de Medicina
      if (role !== 'CHEFE_DIV_MEDICINA') {
        return res.status(403).json({ message: 'Permissão negada: apenas o Chefe da Divisão de Medicina pode realizar esta ação' });
      }

      // Se já existe um formulário para esta solicitação, retornar os dados
      if (request.formulariosRegistrados.length > 0) {
        return res.status(200).json({
          request,
          formulario: request.formulariosRegistrados[0],
          status: 'EXISTENTE'
        });
      }
      
      // Se não existe formulário, retornar os dados da solicitação para pré-preencher o formulário
      return res.status(200).json({
        request,
        status: 'PENDENTE'
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da solicitação:', error);
      return res.status(500).json({ message: 'Erro ao processar a solicitação' });
    }
  } else if (req.method === 'POST') {
    try {
      const { requestId, formularioId } = req.body;

      if (!requestId) {
        return res.status(400).json({ message: 'ID da solicitação é obrigatório' });
      }

      if (!formularioId) {
        return res.status(400).json({ message: 'ID do formulário é obrigatório' });
      }

      // Verificar se a solicitação existe
      const request = await prisma.request.findUnique({
        where: { id: requestId }
      });
      
      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Verificar se o formulário existe
      const formulario = await prisma.formularioMedico.findUnique({
        where: { id: formularioId }
      });
      
      if (!formulario) {
        return res.status(404).json({ message: 'Formulário não encontrado' });
      }

      // Atualizar o status da solicitação para seguir o fluxo
      // Quando o Chefe da Divisão de Medicina completa o formulário, 
      // o fluxo continua para a RM Destino
      await prisma.request.update({
        where: { id: requestId },
        data: {
          status: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_1' // Alterando o fluxo para ir para a RM Destino
        }
      });

      // Registrar a ação no histórico
      await prisma.actionLog.create({
        data: {
          requestId: requestId,
          userId: userId as string,
          action: 'APROVACAO',
          observation: `Formulário médico OMS Destino preenchido (ID: ${formularioId}). Encaminhado para RM Destino.`
        }
      });

      // Retornar sucesso
      return res.status(200).json({ 
        message: 'Avaliação concluída e solicitação encaminhada para RM Destino',
        nextStatus: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_1'
      });
    } catch (error) {
      console.error('Erro ao atualizar status da solicitação:', error);
      return res.status(500).json({ message: 'Erro ao processar a solicitação' });
    }
  } else {
    // Método não permitido
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
