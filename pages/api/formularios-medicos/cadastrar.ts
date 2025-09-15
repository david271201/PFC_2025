import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { UserType } from '@/permissions/utils';

// Schema para validação do formulário médico completo
const formularioMedicoSchema = z.object({
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
  justificativaHotel: z.string().optional(),
  
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

  // Obter ID do usuário da sessão
  const { id: userId } = session.user as UserType;

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

      // Salvar no banco de dados usando Prisma
      const formularioMedico = await prisma.formularioMedico.create({
        data: {
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
          justificativaHotelReservado: dadosFormulario.justificativaHotel,
          
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
          
          // Registro do usuário que criou
          criadoPorId: userId as string,
          
          // ID da solicitação
          requestId: dadosFormulario.requestId
        }
      });
      
      // Registrar a relação como uma observação na solicitação
      await prisma.actionLog.create({
        data: {
          requestId: dadosFormulario.requestId,
          userId: userId as string,
          action: 'CRIACAO',
          observation: `Formulário médico (${dadosFormulario.parte}) ID: ${formularioMedico.id} registrado`
        }
      });

      return res.status(201).json({
        message: 'Formulário médico criado com sucesso',
        id: formularioMedico.id,
        requestId: dadosFormulario.requestId,
        parte: dadosFormulario.parte
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Dados de formulário inválidos',
          errors: error.errors
        });
      }

      console.error('Erro ao criar formulário médico:', error);
      return res.status(500).json({
        message: 'Erro ao processar formulário médico'
      });
    }
  } else {
    // Método não permitido
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
