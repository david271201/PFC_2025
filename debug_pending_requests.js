/**
 * Script para debugar o problema das solicitações que ainda aparecem como pendentes
 * após serem respondidas quando deveriam estar apenas nas "enviadas"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPendingRequests() {
  try {
    console.log('🔍 DEBUGGING: Problema de solicitações pendentes após resposta\n');
    
    // Buscar uma amostra de requests e responses para análise
    console.log('📋 BUSCANDO REQUESTS RECENTES:');
    const requests = await prisma.request.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        sender: { select: { name: true, id: true } },
        requestResponses: {
          include: {
            receiver: { select: { name: true, id: true } },
            actions: true
          }
        },
        actions: true
      }
    });
    
    console.log(`Encontrados ${requests.length} requests recentes\n`);
    
    requests.forEach((request, index) => {
      console.log(`\n📄 REQUEST ${index + 1}:`);
      console.log(`  ID: ${request.id}`);
      console.log(`  Status: ${request.status}`);
      console.log(`  Sender: ${request.sender.name} (${request.sender.id})`);
      console.log(`  Updated: ${request.updatedAt}`);
      console.log(`  Actions: ${request.actions.length} registradas`);
      
      if (request.requestResponses.length > 0) {
        console.log('  📝 RESPONSES:');
        request.requestResponses.forEach((response, respIndex) => {
          console.log(`    ${respIndex + 1}. ID: ${response.id}`);
          console.log(`       Status: ${response.status}`);
          console.log(`       Receiver: ${response.receiver.name} (${response.receiver.id})`);
          console.log(`       Updated: ${response.updatedAt}`);
          console.log(`       Actions: ${response.actions.length} registradas`);
        });
      } else {
        console.log('  📝 Nenhuma response ainda');
      }
    });
    
    console.log('\n🎯 ANALISANDO PROBLEMA ESPECÍFICO:');
    console.log('Verificando se há requests que:');
    console.log('1. Têm responses com actions registradas');
    console.log('2. Ainda aparecem como pendentes quando não deveriam');
    
    // Buscar requests que têm responses com actions mas ainda podem estar aparecendo errado
    const problematicRequests = await prisma.request.findMany({
      where: {
        requestResponses: {
          some: {
            actions: {
              some: {}
            }
          }
        }
      },
      include: {
        sender: { select: { name: true, id: true } },
        requestResponses: {
          include: {
            receiver: { select: { name: true, id: true } },
            actions: {
              include: {
                user: { select: { name: true, role: true } }
              }
            }
          }
        }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`\n🚨 Encontrados ${problematicRequests.length} requests com responses que têm actions:`);
    
    problematicRequests.forEach((request, index) => {
      console.log(`\n🔍 REQUEST PROBLEMÁTICO ${index + 1}:`);
      console.log(`  ID: ${request.id}`);
      console.log(`  Status Request: ${request.status}`);
      console.log(`  Sender: ${request.sender.name}`);
      
      request.requestResponses.forEach((response, respIndex) => {
        console.log(`\n  📝 Response ${respIndex + 1}:`);
        console.log(`    ID: ${response.id}`);
        console.log(`    Status Response: ${response.status}`);
        console.log(`    Receiver: ${response.receiver.name}`);
        
        if (response.actions.length > 0) {
          console.log(`    🎬 ACTIONS (${response.actions.length}):`);
          response.actions.forEach((action, actionIndex) => {
            console.log(`      ${actionIndex + 1}. User: ${action.user.name} (${action.user.role})`);
            console.log(`         Type: ${action.type}`);
            console.log(`         Date: ${action.createdAt}`);
          });
          
          console.log('    ⚡ ANÁLISE:');
          console.log(`       - Response tem actions = DEVERIA estar em "enviadas"`);
          console.log(`       - Status da response: ${response.status}`);
          
          // Verificar se o status ainda requer ação do mesmo papel
          const lastAction = response.actions[response.actions.length - 1];
          console.log(`       - Última ação por: ${lastAction.user.role}`);
          console.log(`       - Status atual da response requer ação de: [verificar statusTransitions]`);
        }
      });
    });
    
    console.log('\n📊 DIAGNÓSTICO:');
    console.log('Para resolver o problema, verificar:');
    console.log('1. Se a lógica de filtro "sent" está correta nas APIs');
    console.log('2. Se responses com actions estão sendo incluídas corretamente em "enviadas"');
    console.log('3. Se responses com actions estão sendo EXCLUÍDAS corretamente de "pendentes"');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPendingRequests();
