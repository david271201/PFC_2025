import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';

// Schema para validação da primeira parte do formulário médico
const formularioMedicoSchema = z.object({
  // Dados do beneficiário
  nomeBeneficiario: z.string().min(1, "Nome completo é obrigatório"),
  precCpMatriculaCpf: z.string().min(1, "Prec-CP/matrícula/CPF é obrigatório"),
  idade: z.string().min(1, "Idade é obrigatória"),
  postoGraduacaoTitular: z.string().min(1, "Posto/graduação do titular é obrigatório"),
  necessitaAcompanhante: z.boolean(),
  consultaExame: z.string().min(1, "Consulta/exame/procedimento solicitado é obrigatório"),
  
  // Campos da Divisão de Medicina
  profissionalCiente: z.string().optional(),
  justificativaProfissionalCiente: z.string().optional(),
  
  // Campos do Depósito de Material Cirúrgico
  materialDisponivel: z.string().optional(),
  justificativaMaterialDisponivel: z.string().optional(),
  
  // Campos do Centro Cirúrgico
  pacienteNoMapa: z.string().optional(),
  justificativaPacienteNoMapa: z.string().optional(),
  setorEmCondicoes: z.string().optional(),
  justificativaSetorEmCondicoes: z.string().optional(),
  
  // Campos da Unidade de Internação
  leitoReservado: z.string().optional(),
  justificativaLeitoReservado: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação
  const session = await auth({ req });
  if (!session) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  const { id, role } = session.user as UserType;

  if (req.method === 'POST') {
    try {
      const data = formularioMedicoSchema.parse(req.body);
      
      // Criar registro no banco de dados
      const formularioMedico = await prisma.formularioMedico.create({
        data: {
          // Dados do beneficiário
          nomeBeneficiario: data.nomeBeneficiario,
          precCpMatriculaCpf: data.precCpMatriculaCpf,
          idade: data.idade,
          postoGraduacaoTitular: data.postoGraduacaoTitular,
          necessitaAcompanhante: data.necessitaAcompanhante,
          consultaExame: data.consultaExame,
          
          // Campos default para a segunda parte (serão atualizados depois)
          profissionalCiente: false,
          materialDisponivel: false,
          pacienteNoMapa: false,
          setorEmCondicoes: false,
          
          // Referência ao usuário que criou
          criadoPorId: id,
        }
      });
      
      return res.status(201).json({ message: 'Formulário médico criado com sucesso', id: formularioMedico.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      
      console.error('Erro ao criar formulário médico:', error);
      return res.status(500).json({ message: 'Erro ao criar formulário médico' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
