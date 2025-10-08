import { ActionType, PrismaClient, RequestStatus } from '@prisma/client';
const prisma = new PrismaClient();
import { checkPermission, UserType } from '@/permissions/utils';
import { auth } from '@@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { role } = session.user as UserType;

    if (!checkPermission(role, 'requests:update')) {
      return NextResponse.json(
        { message: 'Permissão negada' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { requestId, valorPassagem, tipoTransporte } = data;

    if (!requestId || valorPassagem === undefined || !tipoTransporte) {
      return NextResponse.json(
        { message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se a solicitação existe e está no status correto
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { message: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    if (existingRequest.status !== RequestStatus.AGUARDANDO_PASSAGEM) {
      return NextResponse.json(
        { message: 'Solicitação não está no status correto para atualizar dados de passagem' },
        { status: 400 }
      );
    }

    // Atualizar os dados de passagem
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        valorPassagem,
        tipoTransporte: tipoTransporte,
      },
    });

    // Registrar a ação
    await prisma.actionLog.create({
      data: {
        action: ActionType.CRIACAO,
        observation: `Dados de passagem atualizados. Valor: R$ ${valorPassagem}, Tipo: ${tipoTransporte}`,
        request: {
          connect: { id: requestId }
        },
        user: {
          connect: { id: (session.user as UserType).userId }
        },
      },
    });

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    console.error('Erro ao salvar dados de passagem:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}