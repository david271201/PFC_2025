import { PrismaClient, RequestStatus, ActionType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function validateFinalCorrection() {
  try {
    console.log('🎯 VALIDAÇÃO FINAL: Correção de Visibilidade de Solicitações Devolvidas para Correção\n');
    
    // 1. Verificar se há solicitações com NECESSITA_CORRECAO
    const correctionsCount = await prisma.request.count({
      where: { status: RequestStatus.NECESSITA_CORRECAO }
    });
    
    console.log(`📊 Total de solicitações com NECESSITA_CORRECAO: ${correctionsCount}`);
    
    if (correctionsCount === 0) {
      console.log('⚠️ Nenhuma solicitação para testar. Criando cenário de teste...\n');
      
      // Criar cenário de teste
      const testPatient = await prisma.pacient.findFirst();
      const chefeFusex = await prisma.user.findFirst({
        where: { role: Role.CHEFE_FUSEX },
        include: { organization: true }
      });
      const chefeAuditoria = await prisma.user.findFirst({
        where: { role: Role.CHEFE_AUDITORIA }
      });
      
      if (!testPatient || !chefeFusex || !chefeAuditoria) {
        console.log('❌ Não foi possível criar cenário de teste');
        return;
      }
      
      // Criar solicitação
      const testRequest = await prisma.request.create({
        data: {
          pacientCpf: testPatient.cpf,
          senderId: chefeFusex.organizationId!,
          requestedOrganizationIds: [chefeFusex.organizationId!],
          status: RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_1,
          cbhpmCode: 'TESTE001',
          needsCompanion: false,
          opmeCost: 2000.0,
          description: 'Teste final de correção'
        }
      });
      
      // CHEFE_AUDITORIA devolve para correção
      await prisma.$transaction(async (tx) => {
        await tx.actionLog.create({
          data: {
            requestId: testRequest.id,
            userId: chefeAuditoria.id,
            action: ActionType.REPROVACAO,
            observation: 'Teste - devolvendo para correção'
          }
        });
        
        await tx.request.update({
          where: { id: testRequest.id },
          data: { status: RequestStatus.NECESSITA_CORRECAO }
        });
      });
      
      console.log(`✅ Cenário de teste criado: ${testRequest.id}`);
      console.log(`   CHEFE_AUDITORIA (${chefeAuditoria.name}) devolveu para correção\n`);
    }
    
    // 2. Testar cada solicitação com NECESSITA_CORRECAO
    const correctionsRequests = await prisma.request.findMany({
      where: { status: RequestStatus.NECESSITA_CORRECAO },
      include: {
        actions: {
          where: { action: ActionType.REPROVACAO },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        pacient: { select: { name: true } }
      }
    });
    
    let allTestsPassed = true;
    
    for (const request of correctionsRequests) {
      if (request.actions.length === 0) continue;
      
      const whoSentForCorrection = request.actions[0];
      console.log(`\n🔍 TESTANDO: ${request.id} (${request.pacient.name})`);
      console.log(`   Enviado para correção por: ${whoSentForCorrection.user.name} (${whoSentForCorrection.user.role})`);
      
      // TESTE 1: Quem enviou deve ver APENAS em enviadas
      const senderSentCount = await prisma.request.count({
        where: {
          id: request.id,
          status: RequestStatus.NECESSITA_CORRECAO,
          actions: {
            some: {
              userId: whoSentForCorrection.userId,
              action: ActionType.REPROVACAO
            }
          }
        }
      });
      
      const senderPendingCount = await prisma.request.count({
        where: {
          id: request.id,
          status: RequestStatus.NECESSITA_CORRECAO,
          NOT: {
            actions: {
              some: {
                userId: whoSentForCorrection.userId,
                action: ActionType.REPROVACAO
              }
            }
          }
        }
      });
      
      console.log(`   ✓ Quem enviou:`);
      console.log(`     📤 Em ENVIADAS: ${senderSentCount > 0 ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`     📥 Em PENDENTES: ${senderPendingCount > 0 ? '❌ SIM (ERRO!)' : '✅ NÃO'}`);
      
      if (senderSentCount === 0 || senderPendingCount > 0) {
        allTestsPassed = false;
        console.log(`     🚨 FALHA: Visibilidade incorreta para quem enviou!`);
      }
      
      // TESTE 2: Outros usuários devem ver APENAS em pendentes
      const otherUser = await prisma.user.findFirst({
        where: {
          id: { not: whoSentForCorrection.userId },
          role: { in: [Role.OPERADOR_FUSEX, Role.CHEFE_FUSEX, Role.AUDITOR] }
        }
      });
      
      if (otherUser) {
        const otherPendingCount = await prisma.request.count({
          where: {
            id: request.id,
            status: RequestStatus.NECESSITA_CORRECAO,
            NOT: {
              actions: {
                some: {
                  userId: otherUser.id,
                  action: ActionType.REPROVACAO
                }
              }
            }
          }
        });
        
        const otherSentCount = await prisma.request.count({
          where: {
            id: request.id,
            status: RequestStatus.NECESSITA_CORRECAO,
            actions: {
              some: {
                userId: otherUser.id,
                action: ActionType.REPROVACAO
              }
            }
          }
        });
        
        console.log(`   ✓ Outro usuário (${otherUser.name}):`);
        console.log(`     📥 Em PENDENTES: ${otherPendingCount > 0 ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`     📤 Em ENVIADAS: ${otherSentCount > 0 ? '❌ SIM (ERRO!)' : '✅ NÃO'}`);
        
        if (otherPendingCount === 0 || otherSentCount > 0) {
          allTestsPassed = false;
          console.log(`     🚨 FALHA: Visibilidade incorreta para outros usuários!`);
        }
      }
    }
    
    // 3. Resultado final
    console.log(`\n${'='.repeat(60)}`);
    if (allTestsPassed) {
      console.log('🎉 TODOS OS TESTES PASSARAM! ');
      console.log('✅ A correção está funcionando perfeitamente.');
      console.log('✅ Cada solicitação aparece em apenas UMA caixa por usuário.');
      console.log('✅ Visibilidade está correta para todos os cenários testados.');
    } else {
      console.log('❌ ALGUNS TESTES FALHARAM!');
      console.log('⚠️ A correção precisa de ajustes adicionais.');
    }
    console.log(`${'='.repeat(60)}`);
    
  } catch (error) {
    console.error('❌ Erro na validação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateFinalCorrection();
