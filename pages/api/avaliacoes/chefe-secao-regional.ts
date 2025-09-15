import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log para debug da sessão
  console.log('=== API Chefe Secao Regional ===');
  console.log('Cookies recebidos:', req.headers.cookie);
  
  const session = await auth(req, res);
  console.log('Resultado da autenticação:', session ? 'Sessão encontrada' : 'Nenhuma sessão');
  if (session?.user) {
    console.log('Usuário autenticado:', session.user.email);
    console.log('Informações do usuário:', JSON.stringify(session.user, null, 2));
  }
  
  if (!session?.user) {
    console.log('Erro: Usuário não autenticado - session é null ou não tem user');
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const user = session.user as UserType;
  console.log('Papel do usuário autenticado:', user.role);
  
  // Verificar se o usuário tem o papel correto - temporariamente desativado para testes
  /* 
  if (user.role !== Role.CHEFE_SECAO_REGIONAL) {
    console.log('Usuário sem permissão adequada. Papel esperado:', Role.CHEFE_SECAO_REGIONAL, 'Papel atual:', user.role);
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }
  */

  if (req.method === 'POST') {
    try {
      const { requestId, formularioId, aprovado = true } = req.body;

      if (!requestId || !formularioId) {
        return res.status(400).json({ 
          message: 'Dados inválidos. ID da solicitação e ID do formulário são obrigatórios' 
        });
      }

      // Verificar se o usuário está autenticado
      if (!session.user || !session.user.id) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }
      
      const userId = session.user.id;
      
      // Buscar formulário para verificar aprovação
      const formulario = await prisma.formularioMedico.findUnique({
        where: { id: formularioId }
      });
      
      if (!formulario) {
        return res.status(404).json({ message: 'Formulário não encontrado' });
      }
      
      // Define o próximo status com base na aprovação
      const nextStatus = aprovado ? 'AGUARDANDO_SUBDIRETOR_SAUDE_1' : 'REPROVADO';
      
      // Usar transação para atualizar status da solicitação e registrar ação
      const result = await prisma.$transaction(async (tx) => {
        // Atualizar status da solicitação
        const request = await tx.request.update({
          where: { id: requestId },
          data: { 
            status: nextStatus,
            updatedAt: new Date()
          }
        });
        
        // Registrar a ação no log
        await tx.actionLog.create({
          data: {
            requestId,
            userId,
            action: aprovado ? 'APROVACAO' : 'REPROVACAO',
            observation: aprovado 
              ? `Formulário da RM Destino aprovado pelo Chefe da Seção Regional` 
              : `Formulário da RM Destino reprovado pelo Chefe da Seção Regional`,
            createdAt: new Date(),
            files: []
          }
        });
        
        return request;
      });

      return res.status(200).json({
        message: `Solicitação ${aprovado ? 'aprovada' : 'reprovada'} com sucesso`,
        status: nextStatus,
        request: result
      });
    } catch (error) {
      console.error('Erro ao processar avaliação:', error);
      return res.status(500).json({ 
        message: 'Erro ao processar avaliação',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}