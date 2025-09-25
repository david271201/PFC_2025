import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';
import { z } from 'zod';

// Patentes militares válidas (inclui variações para compatibilidade)
const VALID_MILITARY_RANKS = [
  '2º Tenente',
  'Segundo Tenente',
  '1º Tenente', 
  'Primeiro Tenente',
  'Capitão',
  'Major',
  'Tenente-Coronel',
  'Coronel',
  'General de Brigada',
  'General de Divisão',
  'General de Exército',
  'Marechal',
  'Dependente'
] as const;

// Schema de validação para atualização de paciente
const updatePacientSchema = z.object({
  precCp: z.string().min(1, 'Prec CP é obrigatório').optional(),
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  rank: z.string().min(1, 'Posto/Graduação é obrigatório').refine(
    (rank) => VALID_MILITARY_RANKS.includes(rank as any),
    'Posto/Graduação inválido'
  ).optional(),
  isDependent: z.boolean().optional(),
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

  // Método GET para buscar paciente por CPF
  if (req.method === 'GET') {
    try {
      const pacient = await prisma.pacient.findUnique({
        where: { cpf },
        include: {
          _count: {
            select: {
              requests: true
            }
          }
        }
      });

      if (!pacient) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      return res.status(200).json(pacient);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      return res.status(500).json({
        message: 'Erro interno do servidor'
      });
    }
  }

  // Método PUT para atualizar paciente
  if (req.method === 'PUT') {
    try {
      const validatedData = updatePacientSchema.parse(req.body);

      // Verificar se o paciente existe
      const existingPacient = await prisma.pacient.findUnique({
        where: { cpf }
      });

      if (!existingPacient) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      // Se está atualizando o Prec CP, verificar se não há conflito
      if (validatedData.precCp && validatedData.precCp !== existingPacient.precCp) {
        const existingPrecCp = await prisma.pacient.findUnique({
          where: { precCp: validatedData.precCp }
        });

        if (existingPrecCp) {
          return res.status(400).json({
            message: 'Já existe um paciente cadastrado com este Prec CP'
          });
        }
      }

      const updatedPacient = await prisma.pacient.update({
        where: { cpf },
        data: validatedData,
        include: {
          _count: {
            select: {
              requests: true
            }
          }
        }
      });

      return res.status(200).json(updatedPacient);
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      return res.status(500).json({
        message: 'Erro interno do servidor'
      });
    }
  }

  // Método DELETE para remover paciente
  if (req.method === 'DELETE') {
    try {
      // Verificar se o paciente existe
      const existingPacient = await prisma.pacient.findUnique({
        where: { cpf },
        include: {
          _count: {
            select: {
              requests: true
            }
          }
        }
      });

      if (!existingPacient) {
        return res.status(404).json({ message: 'Paciente não encontrado' });
      }

      // Verificar se o paciente tem solicitações associadas
      if (existingPacient._count.requests > 0) {
        return res.status(400).json({
          message: 'Não é possível excluir paciente que possui solicitações associadas'
        });
      }

      await prisma.pacient.delete({
        where: { cpf }
      });

      return res.status(200).json({
        message: 'Paciente excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      return res.status(500).json({
        message: 'Erro interno do servidor'
      });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
