import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../auth';
import prisma from '../../../prisma/prismaClient';
import { Role } from '@prisma/client';
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
  
  // Verificar se o usuário é Subdiretor de Saúde
  if (user.role !== Role.SUBDIRETOR_SAUDE) {
    return res.status(403).json({ message: 'Usuário sem permissão' });
  }

  // Métodos GET para listar todas as organizações
  if (req.method === 'GET') {
    try {
      const organizations = await prisma.organization.findMany({
        orderBy: {
          name: 'asc'
        },
        include: {
          users: true,
          sentRequests: {
            select: {
              id: true
            }
          },
          region: true,
          _count: {
            select: {
              users: true,
              sentRequests: true
            }
          }
        }
      });

      return res.status(200).json(organizations);
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      return res.status(500).json({
        message: 'Erro ao buscar organizações'
      });
    }
  } 
  // Método POST para criar uma nova organização
  else if (req.method === 'POST') {
    try {
      const { name, regionId } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Nome da organização é obrigatório' });
      }

      if (!regionId) {
        return res.status(400).json({ message: 'Região é obrigatória' });
      }

      // Verificar se a região existe
      const region = await prisma.region.findUnique({
        where: { id: regionId }
      });

      if (!region) {
        return res.status(404).json({ message: 'Região não encontrada' });
      }

      // Verificar se já existe uma organização com o mesmo nome
      const existingOrganization = await prisma.organization.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: 'insensitive'  // Case insensitive para evitar duplicidades como "OM" e "om"
          }
        }
      });

      if (existingOrganization) {
        return res.status(409).json({ message: 'Já existe uma organização com este nome' });
      }

      // Criar nova organização
      const organization = await prisma.organization.create({
        data: {
          name: name.trim(),
          regionId: regionId
        }
      });

      return res.status(201).json(organization);
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      return res.status(500).json({
        message: 'Erro ao criar organização'
      });
    }
  } 
  // Método DELETE para remover uma organização
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'ID da organização inválido' });
      }

      // Verificar se existem usuários ou solicitações associados à organização
      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              sentRequests: true
            }
          }
        }
      });

      if (!organization) {
        return res.status(404).json({ message: 'Organização não encontrada' });
      }

      // Impedir a remoção se houver usuários ou solicitações associados
      if (organization._count.users > 0) {
        return res.status(409).json({ 
          message: 'Esta organização possui usuários associados e não pode ser removida' 
        });
      }

      if (organization._count.sentRequests > 0) {
        return res.status(409).json({ 
          message: 'Esta organização possui solicitações associadas e não pode ser removida' 
        });
      }

      // Remover a organização
      await prisma.organization.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Organização removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover organização:', error);
      return res.status(500).json({
        message: 'Erro ao remover organização'
      });
    }
  }
  // Método não permitido
  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
