import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { UserType } from '@/permissions/utils';

// Schema para validação do formulário médico completo
const formularioMedicoSchema = z.object({
  // ID opcional para atualização
  id: z.string().uuid("ID do formulário inválido").optional(),
  
  // Dados do beneficiário
  nomeBeneficiario: z.string().min(1, "Nome completo é obrigatório"),
  precCpMatriculaCpf: z.string().min(1, "Prec-CP/matrícula/CPF é obrigatório"),
  idade: z.string().min(1, "Idade é obrigatória"),
  postoGraduacaoTitular: z.string().min(1, "Posto/graduação do titular é obrigatório"),
  necessitaAcompanhante: z.boolean(),
  consultaExame: z.string().min(1, "Consulta/exame/procedimento solicitado é obrigatório"),
  
  // Campos da Divisão de Medicina
  profissionalCiente: z.boolean().optional(),
  justificativaProfissionalCiente: z.string().optional(),
  
  // Campos do Depósito de Material Cirúrgico
  materialDisponivel: z.boolean().optional(),
  justificativaMaterialDisponivel: z.string().optional(),
  
  // Campos do Centro Cirúrgico
  pacienteNoMapa: z.boolean().optional(),
  justificativaPacienteNoMapa: z.string().optional(),
  setorEmCondicoes: z.boolean().optional(),
  justificativaSetorEmCondicoes: z.string().optional(),
  
  // Campos da Unidade de Internação
  leitoReservado: z.boolean().optional(),
  justificativaLeitoReservado: z.string().optional(),
  
  // Campos da Assistência Social
  hotelReservado: z.boolean().optional(),
  justificativaHotelReservado: z.string().optional(), // Corrigido de justificativaHotel para justificativaHotelReservado
  
  // Campos de Traslado
  motorista1: z.string().optional(),
  horario1: z.string().optional(),
  motorista2: z.string().optional(),
  horario2: z.string().optional(),
  motorista3: z.string().optional(),
  horario3: z.string().optional(),
  motorista4: z.string().optional(),
  horario4: z.string().optional(),
  
  // Observações
  observacoes: z.string().optional(),
  
  // Aprovação
  aprovacao: z.boolean().optional(),
  
  // ID da solicitação relacionada
  requestId: z.string().uuid("ID da solicitação inválido"),
  
  // Parte do formulário (OMS_DESTINO ou RM_DESTINO)
  parte: z.enum(["OMS_DESTINO", "RM_DESTINO"]),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar a sessão do usuário
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  // Obter informações do usuário da sessão
  console.log('Estrutura da sessão do usuário:', JSON.stringify(session.user, null, 2));
  
  // Extrair o userId diretamente da sessão
  const userId = (session.user as any).userId;
  
  // Garantir que temos um ID de usuário válido
  if (!userId) {
    console.error('ID do usuário não encontrado na sessão:', session.user);
    return res.status(401).json({ message: 'ID do usuário não encontrado na sessão' });
  }
  
  console.log('ID do usuário usado para o formulário:', userId);

  if (req.method === 'POST') {
    try {
      // Validar dados do formulário
      const dadosFormulario = formularioMedicoSchema.parse(req.body);
      
      // Verificar se a solicitação existe
      const requestExists = await prisma.request.findUnique({
        where: { id: dadosFormulario.requestId }
      });
      
      if (!requestExists) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }

      // Dados comuns para create ou update
      const dadosFormularioCommon = {
        // Dados do beneficiário
        nomeBeneficiario: dadosFormulario.nomeBeneficiario,
        precCpMatriculaCpf: dadosFormulario.precCpMatriculaCpf,
        idade: dadosFormulario.idade,
        postoGraduacaoTitular: dadosFormulario.postoGraduacaoTitular,
        necessitaAcompanhante: dadosFormulario.necessitaAcompanhante,
        consultaExame: dadosFormulario.consultaExame,
        
        // Divisão de Medicina
        profissionalCiente: dadosFormulario.profissionalCiente || false,
        justificativaProfissionalCiente: dadosFormulario.justificativaProfissionalCiente,
        
        // Depósito de Material Cirúrgico
        materialDisponivel: dadosFormulario.materialDisponivel || false,
        justificativaMaterialDisponivel: dadosFormulario.justificativaMaterialDisponivel,
        
        // Centro Cirúrgico
        pacienteNoMapa: dadosFormulario.pacienteNoMapa || false,
        justificativaPacienteNoMapa: dadosFormulario.justificativaPacienteNoMapa,
        setorEmCondicoes: dadosFormulario.setorEmCondicoes || false,
        justificativaSetorEmCondicoes: dadosFormulario.justificativaSetorEmCondicoes,
        
        // Unidade de Internação
        leitoReservado: dadosFormulario.leitoReservado,
        justificativaLeitoReservado: dadosFormulario.justificativaLeitoReservado,
        
        // Assistência Social
        hotelReservado: dadosFormulario.hotelReservado,
        justificativaHotelReservado: dadosFormulario.justificativaHotelReservado,
        
        // Traslado
        motorista1: dadosFormulario.motorista1,
        horario1: dadosFormulario.horario1,
        motorista2: dadosFormulario.motorista2,
        horario2: dadosFormulario.horario2,
        motorista3: dadosFormulario.motorista3,
        horario3: dadosFormulario.horario3,
        motorista4: dadosFormulario.motorista4,
        horario4: dadosFormulario.horario4,
        
        // Aprovação
        aprovacao: dadosFormulario.aprovacao,
        
        // ID da solicitação
        requestId: dadosFormulario.requestId
      };

      let formularioMedico;
      let action;
      let message;

      // Verificar se é uma atualização ou criação
      if (dadosFormulario.id) {
        // Verificar se o formulário existe
        const formularioExiste = await prisma.formularioMedico.findUnique({
          where: { id: dadosFormulario.id }
        });

        if (!formularioExiste) {
          return res.status(404).json({ message: 'Formulário médico não encontrado para atualização' });
        }

        // Atualizar formulário existente - versão simplificada
        const updateData = {
          nomeBeneficiario: dadosFormularioCommon.nomeBeneficiario,
          precCpMatriculaCpf: dadosFormularioCommon.precCpMatriculaCpf,
          idade: dadosFormularioCommon.idade,
          postoGraduacaoTitular: dadosFormularioCommon.postoGraduacaoTitular,
          necessitaAcompanhante: dadosFormularioCommon.necessitaAcompanhante,
          consultaExame: dadosFormularioCommon.consultaExame,
          profissionalCiente: dadosFormularioCommon.profissionalCiente || false,
          justificativaProfissionalCiente: dadosFormularioCommon.justificativaProfissionalCiente || '',
          materialDisponivel: dadosFormularioCommon.materialDisponivel || false,
          justificativaMaterialDisponivel: dadosFormularioCommon.justificativaMaterialDisponivel || '',
          pacienteNoMapa: dadosFormularioCommon.pacienteNoMapa || false,
          justificativaPacienteNoMapa: dadosFormularioCommon.justificativaPacienteNoMapa || '',
          setorEmCondicoes: dadosFormularioCommon.setorEmCondicoes || false,
          justificativaSetorEmCondicoes: dadosFormularioCommon.justificativaSetorEmCondicoes || '',
          leitoReservado: dadosFormularioCommon.leitoReservado || false,
          justificativaLeitoReservado: dadosFormularioCommon.justificativaLeitoReservado || '',
          requestId: dadosFormularioCommon.requestId,
          updatedAt: new Date()
        };
        
        console.log('Atualizando formulário com ID:', dadosFormulario.id);
        
        try {
          formularioMedico = await prisma.formularioMedico.update({
            where: { id: dadosFormulario.id },
            data: updateData
          });
          
          console.log('Formulário atualizado com sucesso:', {
            id: formularioMedico.id,
            requestId: formularioMedico.requestId
          });
        } catch (prismaError) {
          console.error('Erro específico do Prisma ao atualizar formulário:', prismaError);
          throw prismaError;
        }
        action = 'ATUALIZACAO';
        message = 'Formulário médico atualizado com sucesso';
      } else {
        // Criar novo formulário
        // Log antes da operação de criação
        console.log('Tentando criar formulário com os seguintes dados:', {
          ...dadosFormularioCommon,
          criadoPorId: userId
        });
        
        // Dados simplificados para criação do formulário - apenas o essencial
        const createData = {
          nomeBeneficiario: dadosFormularioCommon.nomeBeneficiario,
          precCpMatriculaCpf: dadosFormularioCommon.precCpMatriculaCpf,
          idade: dadosFormularioCommon.idade,
          postoGraduacaoTitular: dadosFormularioCommon.postoGraduacaoTitular,
          necessitaAcompanhante: dadosFormularioCommon.necessitaAcompanhante,
          consultaExame: dadosFormularioCommon.consultaExame,
          profissionalCiente: dadosFormularioCommon.profissionalCiente || false,
          justificativaProfissionalCiente: dadosFormularioCommon.justificativaProfissionalCiente || '',
          materialDisponivel: dadosFormularioCommon.materialDisponivel || false,
          justificativaMaterialDisponivel: dadosFormularioCommon.justificativaMaterialDisponivel || '',
          pacienteNoMapa: dadosFormularioCommon.pacienteNoMapa || false,
          justificativaPacienteNoMapa: dadosFormularioCommon.justificativaPacienteNoMapa || '',
          setorEmCondicoes: dadosFormularioCommon.setorEmCondicoes || false,
          justificativaSetorEmCondicoes: dadosFormularioCommon.justificativaSetorEmCondicoes || '',
          leitoReservado: dadosFormularioCommon.leitoReservado || false,
          justificativaLeitoReservado: dadosFormularioCommon.justificativaLeitoReservado || '',
          requestId: dadosFormularioCommon.requestId,
          criadoPorId: userId
        };
        
        console.log('Dados finais para criação:', createData);
        
        try {
          formularioMedico = await prisma.formularioMedico.create({
            data: createData
          });
          
          console.log('Formulário criado com sucesso:', {
            id: formularioMedico.id,
            requestId: formularioMedico.requestId
          });
        } catch (prismaError) {
          console.error('Erro específico do Prisma ao criar formulário:', prismaError);
          throw prismaError;
        }
        action = 'CRIACAO';
        message = 'Formulário médico criado com sucesso';
      }
      
      // Registrar a ação no log com informações mais detalhadas
      await prisma.actionLog.create({
        data: {
          requestId: dadosFormulario.requestId,
          userId: userId as string,
          action: action === 'CRIACAO' ? 'CRIACAO' : 'APROVACAO', // Usando APROVACAO para atualizações
          observation: `Formulário médico (${dadosFormulario.parte}) ID: ${formularioMedico.id} ${action === 'CRIACAO' ? 'registrado' : 'atualizado'} em ${new Date().toLocaleString()}`
        }
      });

      return res.status(201).json({
        message,
        id: formularioMedico.id,
        requestId: dadosFormulario.requestId,
        parte: dadosFormulario.parte,
        criadoPor: {
          id: userId
        },
        createdAt: formularioMedico.createdAt,
        updatedAt: formularioMedico.updatedAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Erro de validação Zod:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          message: 'Dados de formulário inválidos',
          errors: error.errors
        });
      }

      console.error('Erro ao criar formulário médico:', error);
      console.error('Detalhes completos do erro:', error instanceof Error ? error.stack : JSON.stringify(error));
      console.error('Dados recebidos:', JSON.stringify(req.body, null, 2));
      return res.status(500).json({
        message: 'Erro ao processar formulário médico',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    // Método não permitido
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
