import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../../auth';
import prisma from '../../../../prisma/prismaClient';
import { Role } from '@prisma/client';
import { UserType } from '@/permissions/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await auth(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const user = session.user as UserType;
  // Verificar se o usuário tem o papel correto
  if (user.role !== Role.CHEFE_DIV_MEDICINA) {
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }

  const { requestId } = req.query;
  
  if (!requestId || Array.isArray(requestId)) {
    return res.status(400).json({ message: 'ID da solicitação inválido' });
  }

  if (req.method === 'POST') {
    try {
      const formData = req.body;

      // Criar novo formulário
      const formulario = await prisma.formularioMedicoChefeDiv4.create({
        data: {
          ...formData,
          requestId: requestId,
          createdAt: new Date(),
          userId: session.user.id
        }
      });

      return res.status(201).json(formulario);
    } catch (error) {
      console.error('Erro ao criar formulário:', error);
      return res.status(500).json({ message: 'Erro ao criar formulário' });
    }
  } else if (req.method === 'GET') {
    try {
      const formulario = await prisma.formularioMedicoChefeDiv4.findFirst({
        where: {
          requestId: requestId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!formulario) {
        return res.status(404).json({ message: 'Formulário não encontrado' });
      }

      return res.status(200).json(formulario);
    } catch (error) {
      console.error('Erro ao buscar formulário:', error);
      return res.status(500).json({ message: 'Erro ao buscar formulário' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
