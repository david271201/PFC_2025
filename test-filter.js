const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFilter() {
  console.log('🧪 Testando filtro CHEFE_DIV_MEDICINA_4...\n');

  // Buscar solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4
  const requests = await prisma.request.findMany({
    where: {
      status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
    },
    include: {
      sender: {
        select: {
          name: true
        }
      },
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

  console.log(`📊 Encontradas ${requests.length} solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4`);

  for (const request of requests) {
    console.log(`\n🔸 Solicitação ID: ${request.id}`);
    console.log(`   📤 Enviada por: ${request.sender.name}`);
    console.log(`   🎯 Organizações de destino: ${JSON.stringify(request.requestedOrganizationIds)}`);
    
    const selectedResponse = request.requestResponses.find(r => r.selected);
    if (selectedResponse) {
      console.log(`   ✅ Resposta selecionada: ${selectedResponse.receiver.name} (ID: ${selectedResponse.receiverId})`);
      
      const isCorrect = request.requestedOrganizationIds.includes(selectedResponse.receiverId);
      console.log(`   🎯 Correto? ${isCorrect ? '✅ Sim' : '❌ Não'}`);
    }
    
    console.log(`   📝 Todas as respostas:`);
    request.requestResponses.forEach(resp => {
      console.log(`      - ${resp.receiver.name}: Selected=${resp.selected}, Status=${resp.status}`);
    });
  }
  
  await prisma.$disconnect();
}

testFilter().catch(console.error);
