import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';
import { z } from 'zod';

// Patentes militares conforme especificação
const PATENTES_MILITARES = [
  'Marechal',
  'General-de-Exército',
  'General-de-Divisão',
  'General-de-Brigada',
  'Coronel',
  'Tenente-Coronel',
  'Major',
  'Capitão',
  'Primeiro Tenente',
  'Segundo Tenente'
] as const;

// Schema para atualização
const updatePacienteSchema = z.object({
  precCp: z.string().min(1, 'Prec CP é obrigatório').optional(),
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  rank: z.string().refine(
    (rank) => PATENTES_MILITARES.includes(rank as any),
    'Patente militar inválida'
  ).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticação
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const user = session.user as UserType;
  
  // Verificar se o usuário é Subdiretor de Saúde
  if (user.role !== Role.SUBDIRETOR_SAUDE) {
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }

  const { cpf } = req.query;
  if (!cpf || typeof cpf !== 'string') {
    return res.status(400).json({ message: 'CPF é obrigatório' });
  }

  // GET - Buscar paciente específico
  if (req.method === 'GET') {
    try {
      const pacient = await prisma.pacient.findUnique({
        where: { cpf },
        include: {
          _count: {
            select: { requests: true }
          }
        }
      });

      if (!pacient) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      return res.status(200).json(pacient);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // PUT - Atualizar paciente
  if (req.method === 'PUT') {
    try {
      const validatedData = updatePacienteSchema.parse(req.body);

      // Verificar se o paciente existe
      const existingPacient = await prisma.pacient.findUnique({
        where: { cpf }
      });

      if (!existingPacient) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      // Verificar Prec CP único (se estiver sendo alterado)
      if (validatedData.precCp && validatedData.precCp !== existingPacient.precCp) {
        const existingPrecCp = await prisma.pacient.findUnique({
          where: { precCp: validatedData.precCp }
        });
        if (existingPrecCp) {
          return res.status(400).json({ message: 'Prec CP já cadastrado' });
        }
      }

      // Atualizar paciente
      const updatedPacient = await prisma.pacient.update({
        where: { cpf },
        data: validatedData,
        include: {
          _count: {
            select: { requests: true }
          }
        }
      });

      return res.status(200).json(updatedPacient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      console.error('Erro ao atualizar paciente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // DELETE - Excluir paciente
  if (req.method === 'DELETE') {
    try {
      // Verificar se o paciente existe e se tem solicitações
      const existingPacient = await prisma.pacient.findUnique({
        where: { cpf },
        include: {
          _count: {
            select: { requests: true }
          }
        }
      });

      if (!existingPacient) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      // Não permitir exclusão se houver solicitações
      if (existingPacient._count.requests > 0) {
        return res.status(400).json({
          message: 'Não é possível excluir paciente com solicitações associadas'
        });
      }

      // Excluir paciente
      await prisma.pacient.delete({
        where: { cpf }
      });

      return res.status(200).json({ message: 'Paciente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
