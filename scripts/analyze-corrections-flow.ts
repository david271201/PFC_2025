import { PrismaClient, RequestStatus, ActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeCorrectionsFlow() {
  try {
    console.log('🔍 Analisando fluxo de correções atual...\n');
    
    // Buscar solicitações com NECESSITA_CORRECAO
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
                role: true,
                organizationId: true
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

    console.log(`📋 Encontradas ${correctionsRequests.length} solicitação(ões) com NECESSITA_CORRECAO:\n`);

    for (const request of correctionsRequests) {
      console.log(`🔸 Solicitação: ${request.id}`);
      console.log(`   Paciente: ${request.pacient.name}`);
      console.log(`   Organização origem: ${request.sender.name}`);
      
      if (request.actions.length > 0) {
        const lastReprovacao = request.actions[0];
        console.log(`   👤 Enviou para correção: ${lastReprovacao.user.name} (${lastReprovacao.user.role})`);
        console.log(`   🏥 Organização de quem enviou: ${lastReprovacao.user.organizationId}`);
        console.log(`   📅 Data: ${lastReprovacao.createdAt}`);
        
        // Analisar quem deveria ver essa solicitação
        console.log(`\n   📊 Visibilidade atual:`);
        console.log(`   - Deve aparecer em ENVIADAS para: ${lastReprovacao.user.name} (${lastReprovacao.user.role})`);
        console.log(`   - Deve aparecer em PENDENTES para: Todos exceto ${lastReprovacao.user.name}`);
      } else {
        console.log(`   ❌ Nenhuma ação de reprovação encontrada`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCorrectionsFlow();
