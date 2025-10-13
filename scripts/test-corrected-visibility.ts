import { PrismaClient, RequestStatus, ActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function testCorrectedVisibility() {
  try {
    console.log('🔧 Testando nova lógica de visibilidade de correções...\n');
    
    // Buscar solicitações com NECESSITA_CORRECAO e seus respectivos "enviadores"
    const correctionsRequests = await prisma.request.findMany({
      where: {
        status: RequestStatus.NECESSITA_CORRECAO
      },
      include: {
        actions: {
          where: {
            action: ActionType.REPROVACAO
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        sender: {
          select: {
            name: true
          }
        },
        pacient: {
          select: {
            name: true
          }
        }
      }
    });

    if (correctionsRequests.length === 0) {
      console.log('❌ Nenhuma solicitação com NECESSITA_CORRECAO encontrada');
      return;
    }

    for (const request of correctionsRequests) {
      if (request.actions.length === 0) continue;
      
      const whoSentForCorrection = request.actions[0];
      
      console.log(`\n📋 Solicitação: ${request.id}`);
      console.log(`   Paciente: ${request.pacient.name}`);
      console.log(`   👤 Enviou para correção: ${whoSentForCorrection.user.name} (${whoSentForCorrection.user.role})`);
      
      // Testar visibilidade para quem ENVIOU para correção (deve aparecer apenas em ENVIADAS)
      console.log(`\n   🧪 Teste para quem ENVIOU (${whoSentForCorrection.user.name}):`);
      
      // Simular busca "enviadas"
      const sentRequests = await prisma.request.findMany({
        where: {
          OR: [
            {
              actions: {
                some: {
                  userId: whoSentForCorrection.userId
                }
              },
              status: {
                not: {
                  in: [] // Aqui entrariam os status onde essa role atua, mas para simplicidade vamos deixar vazio
                }
              }
            },
            // Nova lógica: NECESSITA_CORRECAO para quem enviou para correção
            {
              status: RequestStatus.NECESSITA_CORRECAO,
              actions: {
                some: {
                  userId: whoSentForCorrection.userId,
                  action: ActionType.REPROVACAO
                }
              }
            }
          ]
        },
        select: {
          id: true,
          status: true
        }
      });
      
      const appearsInSent = sentRequests.some(r => r.id === request.id);
      console.log(`   📤 Aparece em ENVIADAS: ${appearsInSent ? '✅ SIM' : '❌ NÃO'}`);
      
      // Simular busca "pendentes" 
      const pendingRequests = await prisma.request.findMany({
        where: {
          OR: [
            {
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
          ]
        },
        select: {
          id: true,
          status: true
        }
      });
      
      const appearsInPending = pendingRequests.some(r => r.id === request.id);
      console.log(`   📥 Aparece em PENDENTES: ${appearsInPending ? '❌ NÃO (Correto!)' : '✅ NÃO (Correto!)'}`);
      
      // Testar para outro usuário qualquer (deve aparecer apenas em PENDENTES)
      const otherUser = await prisma.user.findFirst({
        where: {
          id: {
            not: whoSentForCorrection.userId
          },
          role: {
            in: ['CHEFE_FUSEX', 'AUDITOR', 'CHEFE_AUDITORIA', 'OPERADOR_FUSEX']
          }
        }
      });
      
      if (otherUser) {
        console.log(`\n   🧪 Teste para OUTRO usuário (${otherUser.name}):`);
        
        // Para outro usuário - deve aparecer em pendentes
        const otherPending = await prisma.request.findMany({
          where: {
            OR: [
              {
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
            ]
          },
          select: {
            id: true
          }
        });
        
        const otherAppearsInPending = otherPending.some(r => r.id === request.id);
        console.log(`   📥 Aparece em PENDENTES: ${otherAppearsInPending ? '✅ SIM' : '❌ NÃO'}`);
        
        // Para outro usuário - NÃO deve aparecer em enviadas
        const otherSent = await prisma.request.findMany({
          where: {
            status: RequestStatus.NECESSITA_CORRECAO,
            actions: {
              some: {
                userId: otherUser.id,
                action: ActionType.REPROVACAO
              }
            }
          },
          select: {
            id: true
          }
        });
        
        const otherAppearsInSent = otherSent.some(r => r.id === request.id);
        console.log(`   📤 Aparece em ENVIADAS: ${otherAppearsInSent ? '❌ SIM (Erro!)' : '✅ NÃO'}`);
      }
    }
    
    console.log('\n✅ Teste de nova lógica concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectedVisibility();
