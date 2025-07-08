import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { UserType } from '@/permissions/utils';

// Schema para validação da segunda parte do formulário médico
const formularioMedicoParte2Schema = z.object({
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
  
  // Aprovação do checklist
  aprovacao: z.boolean().optional(),
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
      const data = formularioMedicoParte2Schema.parse(req.body);
      
      // Criar registro no banco de dados para a parte 2 (assistência social e traslado)
      const formularioParte2 = await prisma.formularioMedico.create({
        data: {
          // Campos mínimos necessários
          nomeBeneficiario: "Formulário Parte 2 - Independente",
          precCpMatriculaCpf: "N/A",
          idade: "N/A",
          postoGraduacaoTitular: "N/A",
          necessitaAcompanhante: false,
          consultaExame: "N/A",
          profissionalCiente: false,
          materialDisponivel: false,
          pacienteNoMapa: false,
          setorEmCondicoes: false,
          
          // Campos da Assistência Social
          hotelReservado: data.hotelReservado || false,
          justificativaHotelReservado: data.justificativaHotel,
          
          // Campos de Traslado
          motorista1: data.motorista1,
          horario1: data.horario1,
          motorista2: data.motorista2,
          horario2: data.horario2,
          motorista3: data.motorista3,
          horario3: data.horario3,
          motorista4: data.motorista4,
          horario4: data.horario4,
          
          // Aprovação
          aprovacao: data.aprovacao || false,
          
          // Referência ao usuário que criou
          criadoPorId: id,
        }
      });
      
      return res.status(201).json({ message: 'Formulário de traslado criado com sucesso', id: formularioParte2.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      
      console.error('Erro ao criar formulário de traslado:', error);
      return res.status(500).json({ message: 'Erro ao criar formulário de traslado' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
