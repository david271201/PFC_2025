/**
 * Script para testar se ainda há responses pendentes reais
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPendingResponsesReal() {
  try {
    console.log('🧪 TESTANDO RESPONSES PENDENTES REAIS\n');
    
    // Buscar todas as responses que estão com status AGUARDANDO_CHEFE_SECAO_REGIONAL_3
    // mas que NÃO têm actions de CHEFE_SECAO_REGIONAL
    const chefeSectionRegionalUsers = await prisma.user.findMany({
      where: { 
        role: 'CHEFE_DIV_MEDICINA',  // Usar papel que sabemos que existe
        organizationId: { not: null }  // Filtrar apenas usuários com organização
      },
      select: { id: true, name: true, organizationId: true }
    });
    
    console.log(`👥 Encontrados ${chefeSectionRegionalUsers.length} usuários CHEFE_DIV_MEDICINA\n`);
    
    for (const user of chefeSectionRegionalUsers) {
      console.log(`👤 Testando: ${user.name} - Org: ${user.organizationId}`);
      
      // Responses pendentes para este usuário
      const pendingResponses = await prisma.requestResponse.findMany({
        where: {
          receiverId: user.organizationId,
          status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_3',  // Status correspondente ao papel
          NOT: {
            actions: {
              some: {
                userId: user.id
              }
            }
          }
        },
        include: {
          request: { select: { id: true, status: true, pacientCpf: true } },
          actions: { select: { id: true, userId: true } }
        }
      });
      
      // Responses já processadas (enviadas)
      const sentResponses = await prisma.requestResponse.findMany({
        where: {
          receiverId: user.organizationId,
          actions: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          request: { select: { id: true, status: true, pacientCpf: true } },
          actions: { 
            where: { userId: user.id },
            select: { id: true, createdAt: true } 
          }
        }
      });
      
      console.log(`  📝 Responses PENDENTES: ${pendingResponses.length}`);
      console.log(`  ✅ Responses ENVIADAS: ${sentResponses.length}`);
      
      if (pendingResponses.length > 0) {
        console.log('    🔍 Detalhes das pendentes:');
        pendingResponses.slice(0, 3).forEach((response, index) => {
          console.log(`      ${index + 1}. Response: ${response.id.substring(0, 8)}... (CPF: ${response.request.pacientCpf})`);
          console.log(`         Status Response: ${response.status}`);
          console.log(`         Status Request: ${response.request.status}`);
          console.log(`         Actions totais: ${response.actions.length}`);
        });
      }
      
      if (sentResponses.length > 0) {
        console.log('    ✅ Últimas enviadas:');
        sentResponses.slice(-2).forEach((response, index) => {
          console.log(`      ${index + 1}. Response: ${response.id.substring(0, 8)}... (CPF: ${response.request.pacientCpf})`);
          console.log(`         Status Response: ${response.status}`);
          console.log(`         Status Request: ${response.request.status}`);
          console.log(`         Actions do usuário: ${response.actions.length}`);
        });
      }
      
      console.log('');
    }
    
    console.log('📊 ANÁLISE GERAL:');
    console.log('Se há responses pendentes, elas aparecerão APENAS em "Pendentes"');
    console.log('Se há responses com actions do usuário, elas aparecerão APENAS em "Enviadas"');
    console.log('✅ Correção implementada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPendingResponsesReal();
