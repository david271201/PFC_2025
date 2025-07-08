import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
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
  profissionalCiente: z.boolean(),
  justificativaNegativa: z.string().optional(),
  
  // Campos do Depósito de Material Cirúrgico
  materialDisponivel: z.boolean(),
  justificativaMaterial: z.string().optional(),
  
  // Campos do Centro Cirúrgico
  pacienteNoMapa: z.boolean(),
  justificativaMapa: z.string().optional(),
  setorEmCondicoes: z.boolean(),
  justificativaSetor: z.string().optional(),
  
  // Campos da Unidade de Internação
  leitoReservado: z.boolean(),
  justificativaLeito: z.string().optional(),
  
  // Campos da Assistência Social
  hotelReservado: z.boolean(),
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
  
  // Aprovação
  aprovacao: z.boolean().optional(),
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
          profissionalCiente: dadosFormulario.profissionalCiente,
          justificativaProfissionalCiente: dadosFormulario.justificativaNegativa,
          
          // Depósito de Material Cirúrgico
          materialDisponivel: dadosFormulario.materialDisponivel,
          justificativaMaterialDisponivel: dadosFormulario.justificativaMaterial,
          
          // Centro Cirúrgico
          pacienteNoMapa: dadosFormulario.pacienteNoMapa,
          justificativaPacienteNoMapa: dadosFormulario.justificativaMapa,
          setorEmCondicoes: dadosFormulario.setorEmCondicoes,
          justificativaSetorEmCondicoes: dadosFormulario.justificativaSetor,
          
          // Unidade de Internação
          leitoReservado: dadosFormulario.leitoReservado,
          justificativaLeitoReservado: dadosFormulario.justificativaLeito,
          
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
          criadoPorId: userId
        }
      });

      return res.status(201).json({
        message: 'Formulário médico criado com sucesso',
        id: formularioMedico.id
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
