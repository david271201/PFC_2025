import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';
import { z } from 'zod';

// Schema de validação para criação/atualização de paciente
const pacientSchema = z.object({
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos'),
  precCp: z.string().min(1, 'Prec CP é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  rank: z.string().min(1, 'Posto/Graduação é obrigatório'),
  isDependent: z.boolean().default(false),
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

  // Método GET para listar todos os pacientes
  if (req.method === 'GET') {
    try {
      const { search, page = '1', limit = '10' } = req.query;
      
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;

      // Construir filtros de busca
      const where: any = {};
      
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { precCp: { contains: search } },
          { rank: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Buscar pacientes com paginação
      const [pacients, total] = await Promise.all([
        prisma.pacient.findMany({
          where,
          skip,
          take: limitNumber,
          orderBy: {
            name: 'asc'
          },
          include: {
            _count: {
              select: {
                requests: true
              }
            }
          }
        }),
        prisma.pacient.count({ where })
      ]);

      return res.status(200).json({
        pacients,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      return res.status(500).json({
        message: 'Erro interno do servidor'
      });
    }
  }

  // Método POST para criar novo paciente
  if (req.method === 'POST') {
    try {
      const validatedData = pacientSchema.parse(req.body);

      // Verificar se já existe paciente com este CPF
      const existingPacient = await prisma.pacient.findUnique({
        where: { cpf: validatedData.cpf }
      });

      if (existingPacient) {
        return res.status(400).json({
          message: 'Já existe um paciente cadastrado com este CPF'
        });
      }

      // Verificar se já existe paciente com este Prec CP
      const existingPrecCp = await prisma.pacient.findUnique({
        where: { precCp: validatedData.precCp }
      });

      if (existingPrecCp) {
        return res.status(400).json({
          message: 'Já existe um paciente cadastrado com este Prec CP'
        });
      }

      const newPacient = await prisma.pacient.create({
        data: validatedData,
        include: {
          _count: {
            select: {
              requests: true
            }
          }
        }
      });

      return res.status(201).json(newPacient);
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      
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

  return res.status(405).json({ message: 'Método não permitido' });
}
