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
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
      
      if (!request) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Verificar se o usuário é Chefe da Seção Regional
      if (role !== 'CHEFE_SECAO_REGIONAL' && role !== 'OPERADOR_SECAO_REGIONAL') {
        return res.status(403).json({ message: 'Permissão negada: apenas o Chefe ou Operador da Seção Regional pode realizar esta ação' });
      }

      // Verificar se já existe um formulário da parte 2 para esta solicitação
      const formulariosParte2 = request.formulariosRegistrados.filter(f => 
        f.consultaExame.includes('RM_DESTINO') || f.consultaExame.includes('Formulário Parte 2')
      );
      
      if (formulariosParte2.length > 0) {
        return res.status(200).json({
          request,
          formulario: formulariosParte2[0],
          formularioOMSDestino: request.formulariosRegistrados.find(f => 
            f.consultaExame.includes('OMS_DESTINO') || !f.consultaExame.includes('Parte 2')
          ),
          status: 'EXISTENTE'
        });
      }
      
      // Obter o formulário da parte 1 (OMS Destino)
      const formularioOMSDestino = request.formulariosRegistrados.find(f => 
        !f.consultaExame.includes('RM_DESTINO') && !f.consultaExame.includes('Parte 2')
      );
      
      if (!formularioOMSDestino) {
        return res.status(404).json({ message: 'Formulário da OMS Destino não encontrado' });
      }
      
      // Se não existe formulário da parte 2, retornar os dados da solicitação e do formulário parte 1
      return res.status(200).json({
        request,
        formularioOMSDestino,
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
      // Quando o Chefe da Seção Regional completa o formulário parte 2, 
      // o fluxo continua para a próxima etapa
      await prisma.request.update({
        where: { id: requestId },
        data: {
          status: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_2'
        }
      });

      // Registrar a ação no histórico
      await prisma.actionLog.create({
        data: {
          requestId: requestId,
          userId: userId as string,
          action: 'APROVACAO',
          observation: `Formulário médico RM Destino preenchido (ID: ${formularioId}). Avaliação concluída.`
        }
      });

      // Retornar sucesso
      return res.status(200).json({ 
        message: 'Avaliação concluída com sucesso',
        nextStatus: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_2'
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
