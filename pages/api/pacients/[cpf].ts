import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@@/auth';
import prisma from '@@/prisma/prismaClient';
import { UserType } from '@/permissions/utils';

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
  
  // Este endpoint é uma versão simplificada que só permite leitura
  // e está disponível para todos os usuários autenticados
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { cpf } = req.query;

  if (!cpf || typeof cpf !== 'string') {
    return res.status(400).json({ message: 'CPF é obrigatório' });
  }

  try {
    const pacient = await prisma.pacient.findUnique({
      where: { cpf },
      select: {
        cpf: true,
        precCp: true,
        name: true,
        rank: true,
        isDependent: true,
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