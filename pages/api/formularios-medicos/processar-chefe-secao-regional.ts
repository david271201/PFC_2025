import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';
import { Role, RequestStatus } from '@prisma/client';

// Schema para validação do formulário médico (parte 2)
const formularioMedicoSchema = z.object({
  id: z.string().uuid("ID do formulário inválido").optional(),
  
  // Campos básicos do beneficiário (necessários para estrutura)
  nomeBeneficiario: z.string().min(1, "Nome completo é obrigatório"),
  precCpMatriculaCpf: z.string().min(1, "Prec-CP/matrícula/CPF é obrigatório"),
  idade: z.string().min(1, "Idade é obrigatória"),
  postoGraduacaoTitular: z.string().min(1, "Posto/graduação do titular é obrigatório"),
  necessitaAcompanhante: z.boolean(),
  consultaExame: z.string().min(1, "Consulta/exame/procedimento solicitado é obrigatório"),
  
  // Campos específicos da parte 2 (RM_DESTINO)
  hotelReservado: z.boolean().optional(),
  justificativaHotelReservado: z.string().optional(),
  motorista1: z.string().optional(),
  horario1: z.string().optional(),
  motorista2: z.string().optional(),
  horario2: z.string().optional(),
  motorista3: z.string().optional(),
  horario3: z.string().optional(),
  motorista4: z.string().optional(),
  horario4: z.string().optional(),
  // Removido o campo observacoes que não existe no modelo FormularioMedico
  aprovacao: z.boolean().optional(),
  
  // ID da solicitação relacionada
  requestId: z.string().uuid("ID da solicitação inválido"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== API Processar Chefe Seção Regional ===');
  console.log('Método:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));
  
  // Verificar a sessão do usuário
  const session = await auth(req, res);
  
  console.log('Resultado da autenticação:', session ? 'Sessão encontrada' : 'Nenhuma sessão');
  if (session?.user) {
    console.log('Sessão do usuário:', JSON.stringify(session.user, null, 2));
  }
  
  if (!session?.user) {
    console.log('Erro: Usuário não autenticado');
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  // Extrair informações do usuário com segurança
  const userId = (session.user as any).userId || session.user.id;
  const userRole = (session.user as any).role;
  
  console.log('Informações extraídas - userId:', userId, 'userRole:', userRole);
  
  if (!userId) {
    console.log('ID do usuário não encontrado na sessão');
    return res.status(401).json({ message: 'ID do usuário não encontrado na sessão' });
  }

  // Permitir apenas POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }

  try {
    // Validar dados do formulário
    const dadosFormulario = formularioMedicoSchema.parse(req.body);
    
    // Verificar se a solicitação existe
    const request = await prisma.request.findUnique({
      where: { id: dadosFormulario.requestId }
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }
    
    // Verificar se o formulário existe para atualização
    let formularioMedico;
    let action = 'ATUALIZACAO';
    
    if (dadosFormulario.id) {
      // Verificar se o formulário existe
      const formularioExiste = await prisma.formularioMedico.findUnique({
        where: { id: dadosFormulario.id }
      });
      
      if (!formularioExiste) {
        return res.status(404).json({ message: 'Formulário médico não encontrado para atualização' });
      }
      
      // Dados para atualização
      const updateData = {
        // Manter os campos existentes
        nomeBeneficiario: dadosFormulario.nomeBeneficiario,
        precCpMatriculaCpf: dadosFormulario.precCpMatriculaCpf,
        idade: dadosFormulario.idade,
        postoGraduacaoTitular: dadosFormulario.postoGraduacaoTitular,
        necessitaAcompanhante: dadosFormulario.necessitaAcompanhante,
        consultaExame: dadosFormulario.consultaExame,
        
        // Atualizar campos da parte 2
        hotelReservado: dadosFormulario.hotelReservado,
        justificativaHotelReservado: dadosFormulario.justificativaHotelReservado,
        motorista1: dadosFormulario.motorista1,
        horario1: dadosFormulario.horario1,
        motorista2: dadosFormulario.motorista2,
        horario2: dadosFormulario.horario2,
        motorista3: dadosFormulario.motorista3,
        horario3: dadosFormulario.horario3,
        motorista4: dadosFormulario.motorista4,
        horario4: dadosFormulario.horario4,
        // Removendo o campo observacoes que não existe no modelo FormularioMedico
        aprovacao: dadosFormulario.aprovacao,
        
        updatedAt: new Date()
      };
      
      // Tudo em uma única transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atualizar formulário
        const updatedForm = await tx.formularioMedico.update({
          where: { id: dadosFormulario.id },
          data: updateData
        });
        
        // 2. Atualizar status da solicitação com base na aprovação
        const nextStatus = dadosFormulario.aprovacao 
          ? RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_1
          : RequestStatus.REPROVADO;
        
        const updatedRequest = await tx.request.update({
          where: { id: dadosFormulario.requestId },
          data: {
            status: nextStatus,
            updatedAt: new Date()
          }
        });
        
        // 3. Registrar a ação
        const actionLog = await tx.actionLog.create({
          data: {
            requestId: dadosFormulario.requestId,
            userId,
            action: dadosFormulario.aprovacao ? 'APROVACAO' : 'REPROVACAO',
            observation: `Formulário da RM Destino ${dadosFormulario.aprovacao ? 'aprovado' : 'reprovado'} pelo Chefe da Seção Regional`,
            files: []
          }
        });
        
        return {
          formulario: updatedForm,
          request: updatedRequest,
          actionLog
        };
      });
      
      return res.status(200).json({
        message: `Formulário médico processado com sucesso e solicitação ${dadosFormulario.aprovacao ? 'aprovada' : 'reprovada'}`,
        id: result.formulario.id,
        requestId: dadosFormulario.requestId,
        newStatus: result.request.status
      });
    } else {
      // Não deveria chegar aqui - o formulário já deveria existir
      return res.status(400).json({ message: 'Formulário não encontrado para atualização' });
    }
  } catch (error) {
    console.error('Erro ao processar formulário:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados de formulário inválidos',
        errors: error.errors
      });
    }
    
    return res.status(500).json({
      message: 'Erro ao processar formulário',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}