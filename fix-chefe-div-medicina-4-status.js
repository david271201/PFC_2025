/**
 * SCRIPT DE CORREÇÃO: Corrigir Status Inconsistentes CHEFE_DIV_MEDICINA_4
 * 
 * Este script irá corrigir as solicitações existentes que têm:
 * - Status da Request: AGUARDANDO_CHEFE_DIV_MEDICINA_4
 * - Status das Responses: APROVADO (inconsistente)
 * - Selected: false (deveria ser true para a organização correta)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function corrigirStatusInconsistentes() {
  console.log('🔧 CORREÇÃO: Status Inconsistentes CHEFE_DIV_MEDICINA_4');
  console.log('=' .repeat(60));

  try {
    // 1. Buscar solicitações problemáticas
    const solicitacoesProblematicas = await prisma.request.findMany({
      where: {
        status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
      },
      include: {
        requestResponses: {
          include: {
            receiver: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Encontradas ${solicitacoesProblematicas.length} solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4`);

    for (const request of solicitacoesProblematicas) {
      console.log(`\n🔍 Processando Request: ${request.id}`);
      console.log(`   Remetente: ${request.senderId}`);
      console.log(`   Destinos: [${request.requestedOrganizationIds?.join(', ')}]`);

      // Verificar se há responses com status inconsistente
      const responsesInconsistentes = request.requestResponses.filter(
        r => r.status !== 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
      );

      if (responsesInconsistentes.length > 0) {
        console.log(`   ⚠️  Responses com status inconsistente: ${responsesInconsistentes.length}`);

        // Corrigir todas as responses para o status correto
        console.log('   🔧 Corrigindo status de todas as responses...');
        await prisma.requestResponse.updateMany({
          where: {
            requestId: request.id
          },
          data: {
            status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
          }
        });
        console.log('   ✅ Status das responses corrigido');
      }

      // Verificar e corrigir a lógica de seleção
      // Para CHEFE_DIV_MEDICINA_4, devemos aplicar o fallback inteligente
      
      // 1. Tentar encontrar organização de destino com CHEFE_DIV_MEDICINA
      const organizacoesDestino = await prisma.organization.findMany({
        where: {
          id: {
            in: request.requestedOrganizationIds
          }
        },
        include: {
          users: {
            where: {
              role: 'CHEFE_DIV_MEDICINA'
            }
          }
        }
      });

      const orgComChefeDivMedicina = organizacoesDestino.find(org => org.users.length > 0);
      
      let targetOrgId;
      if (orgComChefeDivMedicina) {
        // Caso ideal: há uma organização de destino com CHEFE_DIV_MEDICINA
        targetOrgId = orgComChefeDivMedicina.id;
        console.log(`   ✅ Organização com CHEFE_DIV_MEDICINA encontrada: ${orgComChefeDivMedicina.name}`);
      } else {
        // Fallback: aplicar lógica inteligente (excluir remetente)
        const destinationOrgsExcludingSender = request.requestedOrganizationIds.filter(
          orgId => orgId !== request.senderId
        );
        
        targetOrgId = destinationOrgsExcludingSender.length > 0 
          ? destinationOrgsExcludingSender[0] 
          : request.requestedOrganizationIds[0];
        
        const targetOrg = organizacoesDestino.find(org => org.id === targetOrgId);
        console.log(`   🔄 Usando fallback: ${targetOrg?.name || 'N/A'} (${targetOrgId})`);
      }

      // Verificar se a response correta está selecionada
      const responseCorreta = request.requestResponses.find(r => r.receiverId === targetOrgId);
      
      if (responseCorreta) {
        if (!responseCorreta.selected) {
          console.log('   🔧 Corrigindo seleção da response...');
          
          // Desmarcar todas as responses
          await prisma.requestResponse.updateMany({
            where: {
              requestId: request.id
            },
            data: {
              selected: false
            }
          });

          // Marcar apenas a response correta
          await prisma.requestResponse.update({
            where: {
              id: responseCorreta.id
            },
            data: {
              selected: true
            }
          });
          
          console.log(`   ✅ Response correta selecionada: ${responseCorreta.receiver?.name}`);
        } else {
          console.log(`   ✅ Response já está corretamente selecionada: ${responseCorreta.receiver?.name}`);
        }
      } else {
        console.log(`   ⚠️  Response para organização ${targetOrgId} não encontrada`);
        
        // Criar response se não existir
        const targetOrg = organizacoesDestino.find(org => org.id === targetOrgId);
        if (targetOrg) {
          console.log('   🔧 Criando response faltante...');
          
          const novaResponse = await prisma.requestResponse.create({
            data: {
              requestId: request.id,
              receiverId: targetOrgId,
              selected: true,
              status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
            }
          });
          
          console.log(`   ✅ Response criada: ${novaResponse.id}`);
        }
      }
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('\n📋 RESUMO:');
    console.log('- Todas as responses foram atualizadas para status AGUARDANDO_CHEFE_DIV_MEDICINA_4');
    console.log('- Lógica de seleção corrigida (fallback inteligente aplicado)');
    console.log('- Responses faltantes criadas quando necessário');

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar correção
corrigirStatusInconsistentes();
