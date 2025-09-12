import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExistingData() {
  try {
    console.log('=== VERIFICANDO DADOS EXISTENTES ===\n');

    // Verificar quantas solicitações existem
    const requestCount = await prisma.request.count();
    console.log(`📋 Total de solicitações: ${requestCount}`);

    // Verificar quantas respostas existem
    const responseCount = await prisma.requestResponse.count();
    console.log(`📝 Total de respostas: ${responseCount}`);

    // Verificar organizações
    const orgCount = await prisma.organization.count();
    console.log(`🏢 Total de organizações: ${orgCount}`);

    // Verificar regiões
    const regionCount = await prisma.region.count();
    console.log(`🗺️ Total de regiões: ${regionCount}`);

    if (requestCount > 0) {
      console.log('\n=== SOLICITAÇÕES EXISTENTES ===');
      const requests = await prisma.request.findMany({
        take: 5, // Apenas as primeiras 5
        include: {
          sender: {
            include: {
              region: true
            }
          },
          requestResponses: {
            include: {
              receiver: {
                include: {
                  region: true
                }
              }
            }
          }
        }
      });

      requests.forEach((request, index) => {
        console.log(`\n${index + 1}. Solicitação ID: ${request.id}`);
        console.log(`   📅 Criada em: ${request.createdAt.toISOString().split('T')[0]}`);
        console.log(`   🏢 Remetente: ${request.sender.name} (${request.sender.region.name})`);
        console.log(`   💰 OPME: R$ ${(request.opmeCost / 100).toFixed(2)}`);
        console.log(`   💰 PSA: R$ ${((request.psaCost || 0) / 100).toFixed(2)}`);
        console.log(`   📊 Status: ${request.status}`);
        console.log(`   🎯 CBHPM: ${request.cbhpmCode}`);
        
        if (request.requestResponses.length > 0) {
          console.log(`   📝 Respostas (${request.requestResponses.length}):`);
          request.requestResponses.forEach((response, respIndex) => {
            console.log(`     ${respIndex + 1}. ${response.receiver.name}`);
            console.log(`        💰 OPME: R$ ${((response.opmeCost || 0) / 100).toFixed(2)}`);
            console.log(`        💰 Procedimento: R$ ${((response.procedureCost || 0) / 100).toFixed(2)}`);
            console.log(`        💰 Passagem: R$ ${((response.ticketCost || 0) / 100).toFixed(2)}`);
            console.log(`        ✅ Selecionada: ${response.selected ? 'Sim' : 'Não'}`);
            console.log(`        📊 Status: ${response.status}`);
          });
        }
      });
    }

    if (requestCount === 0) {
      console.log('\n⚠️ Não há solicitações no banco de dados.');
      console.log('💡 Para testar a funcionalidade de custos, precisamos de pelo menos algumas solicitações.');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData();
