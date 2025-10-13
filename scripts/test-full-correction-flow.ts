import { PrismaClient, RequestStatus, Role, ActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function testFullCorrectionFlow() {
  try {
    console.log('🔄 Testando fluxo completo de devolução para correção...\n');

    // 1. Criar uma solicitação em um status intermediário para teste
    const testPatient = await prisma.pacient.findFirst();
    const testOrg = await prisma.organization.findFirst();
    
    if (!testPatient || !testOrg) {
      console.log('❌ Não foi possível encontrar paciente ou organização para teste');
      return;
    }

    // Buscar OPERADOR_FUSEX primeiro para usar sua organização
    const operadorFusex = await prisma.user.findFirst({
      where: { role: Role.OPERADOR_FUSEX },
      include: { organization: true }
    });

    if (!operadorFusex || !operadorFusex.organizationId) {
      console.log('❌ OPERADOR_FUSEX não encontrado ou sem organização');
      return;
    }

    // Criar solicitação da organização do OPERADOR_FUSEX
    const testRequest = await prisma.request.create({
      data: {
        pacientCpf: testPatient.cpf,
        senderId: operadorFusex.organizationId,
        requestedOrganizationIds: [operadorFusex.organizationId],
        status: RequestStatus.AGUARDANDO_CHEFE_FUSEX_1,
        cbhpmCode: 'TEST789',
        needsCompanion: false,
        opmeCost: 1500.0,
        description: 'Teste de fluxo de correção'
      }
    });

    // Adicionar um log inicial para simular que foi criada pelo OPERADOR_FUSEX
    await prisma.actionLog.create({
      data: {
        requestId: testRequest.id,
        userId: operadorFusex.id,
        action: ActionType.CRIACAO,
        observation: 'Solicitação criada para teste de correção'
      }
    });

    console.log(`✅ Solicitação criada: ${testRequest.id}`);
    console.log(`   Status inicial: ${testRequest.status}\n`);

    // 2. Buscar um usuário CHEFE_FUSEX para "devolver para correção"
    const chefeFusex = await prisma.user.findFirst({
      where: { role: Role.CHEFE_FUSEX }
    });

    if (!chefeFusex) {
      console.log('❌ Usuário CHEFE_FUSEX não encontrado');
      return;
    }

    // 3. Simular devolução para correção
    console.log(`🔄 Simulando devolução para correção pelo usuário: ${chefeFusex.name}`);
    
    await prisma.$transaction(async (tx) => {
      // Criar log de reprovação (simulando o endpoint de correção)
      await tx.actionLog.create({
        data: {
          requestId: testRequest.id,
          userId: chefeFusex.id,
          action: ActionType.REPROVACAO,
          observation: 'Necessita correção - dados incompletos'
        }
      });

      // Alterar status para NECESSITA_CORRECAO
      await tx.request.update({
        where: { id: testRequest.id },
        data: { status: RequestStatus.NECESSITA_CORRECAO }
      });
    });

    console.log(`✅ Solicitação devolvida para correção`);
    console.log(`   Novo status: NECESSITA_CORRECAO\n`);

    // 4. Testar visibilidade nas APIs
    console.log('📊 Testando visibilidade nas APIs:\n');

    // Para OPERADOR_FUSEX (deve aparecer em enviadas)
    if (operadorFusex) {
      // Simular chamada API para enviadas
      const sentRequests = await prisma.request.findMany({
        where: {
          OR: [
            {
              actions: {
                some: { userId: operadorFusex.id }
              },
              status: {
                not: {
                  in: [RequestStatus.AGUARDANDO_CHEFE_FUSEX_1] // Status onde OPERADOR_FUSEX atua
                }
              }
            },
            {
              status: RequestStatus.NECESSITA_CORRECAO,
              senderId: operadorFusex.organizationId || ''
            }
          ]
        },
        select: {
          id: true,
          status: true
        }
      });

      const correctionInSent = sentRequests.some(r => r.id === testRequest.id);
      console.log(`👤 OPERADOR_FUSEX (${operadorFusex.name}):`);
      console.log(`   📤 Aparece em Enviadas: ${correctionInSent ? '✅ SIM' : '❌ NÃO'}`);
    }

    // Para CHEFE_FUSEX (deve aparecer em pendentes)
    const pendingForChefe = await prisma.request.findMany({
      where: {
        status: {
          in: [RequestStatus.AGUARDANDO_CHEFE_FUSEX_1, RequestStatus.NECESSITA_CORRECAO]
        }
      },
      select: {
        id: true,
        status: true
      }
    });

    const correctionInPending = pendingForChefe.some(r => r.id === testRequest.id);
    console.log(`👤 CHEFE_FUSEX (${chefeFusex.name}):`);
    console.log(`   📥 Aparece em Pendentes: ${correctionInPending ? '✅ SIM' : '❌ NÃO'}`);

    // 5. Simular correção sendo feita
    console.log(`\n🔧 Simulando correção sendo enviada pelo OPERADOR_FUSEX...`);
    
    if (operadorFusex) {
      await prisma.$transaction(async (tx) => {
        // Log de aprovação (correção enviada)
        await tx.actionLog.create({
          data: {
            requestId: testRequest.id,
            userId: operadorFusex.id,
            action: ActionType.APROVACAO,
            observation: 'Correção enviada - dados atualizados'
          }
        });

        // Voltar para o status onde o CHEFE_FUSEX atua
        await tx.request.update({
          where: { id: testRequest.id },
          data: { status: RequestStatus.AGUARDANDO_CHEFE_FUSEX_1 }
        });
      });

      console.log(`✅ Correção enviada - voltou para: AGUARDANDO_CHEFE_FUSEX_1`);
    }

    // 6. Verificar se agora aparece corretamente nas pendentes do CHEFE_FUSEX
    const finalPendingCheck = await prisma.request.findMany({
      where: {
        status: RequestStatus.AGUARDANDO_CHEFE_FUSEX_1
      },
      select: {
        id: true,
        status: true
      }
    });

    const backInPending = finalPendingCheck.some(r => r.id === testRequest.id);
    console.log(`\n📊 Verificação final:`);
    console.log(`   👤 CHEFE_FUSEX - Aparece em Pendentes: ${backInPending ? '✅ SIM' : '❌ NÃO'}`);

    // 7. Limpeza - remover solicitação de teste
    await prisma.actionLog.deleteMany({
      where: { requestId: testRequest.id }
    });
    await prisma.request.delete({
      where: { id: testRequest.id }
    });

    console.log(`\n🧹 Solicitação de teste removida: ${testRequest.id}`);
    console.log(`\n✅ Teste do fluxo completo concluído com sucesso!`);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullCorrectionFlow();
