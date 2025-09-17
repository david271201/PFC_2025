import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../../auth';
import prisma from '../../../../prisma/prismaClient';
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

  const { formularioId } = req.query;

  if (!formularioId || Array.isArray(formularioId)) {
    return res.status(400).json({ message: 'ID do formulário inválido' });
  }

  if (req.method === 'GET') {
    try {
      // Buscar formulário médico por ID com informações completas do criador
      const formulario = await prisma.formularioMedico.findUnique({
        where: { id: formularioId },
        include: {
          criadoPor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  region: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          request: {
            select: {
              id: true,
              description: true,
              status: true,
              cbhpmCode: true,
              needsCompanion: true,
              pacient: {
                select: {
                  name: true,
                  cpf: true,
                  precCp: true,
                  rank: true,
                  isDependent: true
                }
              },
              sender: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          }
        }
      });

      if (!formulario) {
        return res.status(404).json({ message: 'Formulário médico não encontrado' });
      }

      // Retornar os dados do formulário
      return res.status(200).json(formulario);
    } catch (error) {
      console.error('Erro ao buscar formulário médico:', error);
      return res.status(500).json({ message: 'Erro ao buscar formulário médico' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
