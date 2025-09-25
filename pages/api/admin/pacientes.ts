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

// Schema de validação
const pacienteSchema = z.object({
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(11, 'CPF deve ter 11 dígitos'),
  precCp: z.string().min(1, 'Prec CP é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  rank: z.string().refine(
    (rank) => PATENTES_MILITARES.includes(rank as any),
    'Patente militar inválida'
  ),
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

  // GET - Listar pacientes
  if (req.method === 'GET') {
    try {
      const { search, page = '1', limit = '10' } = req.query;
      
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;

      // Filtros de busca
      const where: any = {};
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { precCp: { contains: search } },
          { rank: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Buscar pacientes
      const [pacients, total] = await Promise.all([
        prisma.pacient.findMany({
          where,
          skip,
          take: limitNumber,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { requests: true }
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
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // POST - Criar novo paciente
  if (req.method === 'POST') {
    try {
      const validatedData = pacienteSchema.parse(req.body);

      // Verificar CPF único
      const existingCpf = await prisma.pacient.findUnique({
        where: { cpf: validatedData.cpf }
      });
      if (existingCpf) {
        return res.status(400).json({ message: 'CPF já cadastrado' });
      }

      // Verificar Prec CP único
      const existingPrecCp = await prisma.pacient.findUnique({
        where: { precCp: validatedData.precCp }
      });
      if (existingPrecCp) {
        return res.status(400).json({ message: 'Prec CP já cadastrado' });
      }

      // Criar paciente
      const newPacient = await prisma.pacient.create({
        data: {
          ...validatedData,
          isDependent: false // Sempre titular para as patentes especificadas
        },
        include: {
          _count: {
            select: { requests: true }
          }
        }
      });

      return res.status(201).json(newPacient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Dados inválidos',
          errors: error.errors
        });
      }
      console.error('Erro ao criar paciente:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
