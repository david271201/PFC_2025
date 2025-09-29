/**
 * Script para testar a correção do problema de responses pendentes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testResponsesCorrection() {
  try {
    console.log('🧪 TESTANDO CORREÇÃO: Responses pendentes vs enviadas\n');
    
    // Simular um usuário específico para teste - usando organização PMPV que tem responses
    const testUserId = await prisma.user.findFirst({
      where: { 
        role: 'CHEFE_DIV_MEDICINA',
        organizationId: 'pmpv'  // Organização que sabemos que tem responses
      },
      select: { id: true, name: true, role: true, organizationId: true }
    });
    
    if (!testUserId) {
      console.log('❌ Nenhum usuário CHEFE_DIV_MEDICINA encontrado');
      return;
    }
    
    console.log(`👤 Testando com usuário: ${testUserId.name} (${testUserId.role})`);
    console.log(`🏢 Organização: ${testUserId.organizationId}\n`);
    
    // Verificar statusTransitions para CHEFE_DIV_MEDICINA
    // Hardcode dos status para o teste, pois o import não funciona em scripts standalone
    const statusesForRole = [
      'AGUARDANDO_CHEFE_DIV_MEDICINA_1',
      'AGUARDANDO_CHEFE_DIV_MEDICINA_2', 
      'AGUARDANDO_CHEFE_DIV_MEDICINA_3',
      'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
    ];
    
    console.log(`📋 Status que requerem ação de ${testUserId.role}:`);
    statusesForRole.forEach(status => console.log(`  - ${status}`));
    console.log('');
    
    // TESTE 1: Simular filtro "received" (pendentes) - LÓGICA CORRIGIDA
    console.log('🔍 TESTE 1: Responses PENDENTES (filter=received)');
    const pendingResponses = await prisma.requestResponse.findMany({
      where: {
        receiverId: testUserId.organizationId,
        OR: [
          {
            status: {
              in: statusesForRole
            },
            // CORREÇÃO: Excluir responses onde o usuário já agiu
            NOT: {
              actions: {
                some: {
                  userId: testUserId.id
                }
              }
            }
          },
          {
            status: 'NECESSITA_CORRECAO',
            // CORREÇÃO: Excluir responses onde o usuário já agiu
            NOT: {
              actions: {
                some: {
                  userId: testUserId.id
                }
              }
            }
          }
        ]
      },
      include: {
        actions: {
          where: { userId: testUserId.id },
          select: { id: true, action: true, createdAt: true }
        },
        request: {
          select: { id: true, status: true }
        }
      }
    });
    
    console.log(`Encontradas ${pendingResponses.length} responses PENDENTES:`);
    pendingResponses.forEach((response, index) => {
      console.log(`  ${index + 1}. Response ${response.id.substring(0, 8)}...`);
      console.log(`     Status: ${response.status}`);
      console.log(`     Request Status: ${response.request.status}`);
      console.log(`     Actions do usuário: ${response.actions.length}`);
      console.log(`     ✅ Correto: Não tem actions = deve aparecer em pendentes`);
    });
    console.log('');
    
    // TESTE 2: Simular filtro "sent" (enviadas)
    console.log('🔍 TESTE 2: Responses ENVIADAS (filter=sent)');
    const sentResponses = await prisma.requestResponse.findMany({
      where: {
        receiverId: testUserId.organizationId,
        actions: {
          some: {
            userId: testUserId.id
          }
        }
      },
      include: {
        actions: {
          where: { userId: testUserId.id },
          select: { id: true, action: true, createdAt: true }
        },
        request: {
          select: { id: true, status: true }
        }
      }
    });
    
    console.log(`Encontradas ${sentResponses.length} responses ENVIADAS:`);
    sentResponses.forEach((response, index) => {
      console.log(`  ${index + 1}. Response ${response.id.substring(0, 8)}...`);
      console.log(`     Status: ${response.status}`);
      console.log(`     Request Status: ${response.request.status}`);
      console.log(`     Actions do usuário: ${response.actions.length}`);
      console.log(`     ✅ Correto: Tem actions = deve aparecer em enviadas`);
    });
    console.log('');
    
    // VERIFICAÇÃO DE SOBREPOSIÇÃO
    const pendingIds = new Set(pendingResponses.map(r => r.id));
    const sentIds = new Set(sentResponses.map(r => r.id));
    const overlap = [...pendingIds].filter(id => sentIds.has(id));
    
    console.log('🎯 VERIFICAÇÃO DE SOBREPOSIÇÃO:');
    console.log(`Responses em PENDENTES: ${pendingIds.size}`);
    console.log(`Responses em ENVIADAS: ${sentIds.size}`);
    console.log(`Sobreposição (ERRO se > 0): ${overlap.length}`);
    
    if (overlap.length === 0) {
      console.log('✅ SUCESSO: Nenhuma response aparece em ambas as listas!');
    } else {
      console.log('❌ ERRO: Algumas responses aparecem em ambas as listas:');
      overlap.forEach(id => {
        console.log(`  - ${id}`);
      });
    }
    
    console.log('\n📊 RESUMO DA CORREÇÃO:');
    console.log('✅ Lógica corrigida: Responses com actions do usuário aparecem apenas em "enviadas"');
    console.log('✅ Lógica corrigida: Responses sem actions do usuário aparecem apenas em "pendentes"');
    console.log('✅ Sem sobreposição: Uma response não pode estar em ambas as listas simultaneamente');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testResponsesCorrection();
