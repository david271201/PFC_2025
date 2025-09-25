/**
 * Script para testar se o filtro CHEFE_DIV_MEDICINA_4 está funcionando corretamente
 */
import { PrismaClient, RequestStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function testChefeDivMedicinaFiltering() {
  console.log('🧪 Testando filtro CHEFE_DIV_MEDICINA_4...\n');

  try {
    // 1. Buscar solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4
    const requestsChefeDivMed = await prisma.request.findMany({
      where: {
        status: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            region: {
              select: {
                name: true
              }
            }
          }
        },
        requestResponses: {
          include: {
            receiver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Encontradas ${requestsChefeDivMed.length} solicitações com status AGUARDANDO_CHEFE_DIV_MEDICINA_4`);

    if (requestsChefeDivMed.length === 0) {
      console.log('ℹ️  Nenhuma solicitação encontrada com este status');
      return;
    }

    // 2. Para cada solicitação, verificar as respostas
    for (const request of requestsChefeDivMed) {
      console.log(`\n🔸 Solicitação ID: ${request.id}`);
      console.log(`   📤 Enviada por: ${request.sender.name} (${request.sender.region?.name})`);
      console.log(`   🎯 Organizações de destino: ${request.requestedOrganizationIds.join(', ')}`);
      console.log(`   📋 Total de respostas: ${request.requestResponses.length}`);

      // Verificar qual resposta está selecionada
      const selectedResponse = request.requestResponses.find(r => r.selected);
      if (selectedResponse) {
        console.log(`   ✅ Resposta selecionada: ${selectedResponse.receiver.name} (ID: ${selectedResponse.receiverId})`);
        
        // Verificar se a organização selecionada está no requestedOrganizationIds
        const isCorrectDestination = request.requestedOrganizationIds.includes(selectedResponse.receiverId);
        console.log(`   🎯 Está nas organizações de destino? ${isCorrectDestination ? '✅ Sim' : '❌ Não'}`);
        
        if (!isCorrectDestination) {
          console.log(`   ⚠️  PROBLEMA: A resposta selecionada (${selectedResponse.receiver.name}) não está nas organizações de destino!`);
        }
      } else {
        console.log(`   ❌ Nenhuma resposta selecionada`);
      }

      // Listar todas as respostas
      console.log(`   📝 Todas as respostas:`);
      request.requestResponses.forEach((response, index) => {
        console.log(`      ${index + 1}. ${response.receiver.name} - Selected: ${response.selected}, Status: ${response.status}`);
      });
    }

    // 3. Buscar usuários CHEFE_DIV_MEDICINA das organizações
    console.log('\n👥 Usuários CHEFE_DIV_MEDICINA por organização:');
    
    // Obter todas as organizações que aparecem nas solicitações
    const allOrgIds = new Set<string>();
    requestsChefeDivMed.forEach(req => {
      req.requestedOrganizationIds.forEach(id => allOrgIds.add(id));
      req.requestResponses.forEach(resp => allOrgIds.add(resp.receiverId));
    });

    const organizations = await prisma.organization.findMany({
      where: {
        id: {
          in: Array.from(allOrgIds)
        }
      },
      include: {
        users: {
          where: {
            role: Role.CHEFE_DIV_MEDICINA
          },
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    organizations.forEach(org => {
      console.log(`   🏢 ${org.name}: ${org.users.length} usuário(s) CHEFE_DIV_MEDICINA`);
      org.users.forEach(user => {
        console.log(`      - ${user.name}`);
      });
    });

    // 4. Simular o filtro que seria aplicado na API
    console.log('\n🔍 Simulando filtro da API para diferentes organizações:');
    
    for (const org of organizations) {
      if (org.users.length > 0) {
        console.log(`\n   Para usuário CHEFE_DIV_MEDICINA da ${org.name}:`);
        
        // Aplicar o mesmo filtro que está na API
        const filteredRequests = requestsChefeDivMed.filter(request => {
          const selectedResponse = request.requestResponses.find(r => r.selected);
          return selectedResponse && selectedResponse.receiverId === org.id;
        });
        
        console.log(`   📊 Solicitações que apareceriam: ${filteredRequests.length}`);
        filteredRequests.forEach(req => {
          console.log(`      - Solicitação ${req.id} (de ${req.sender.name})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testChefeDivMedicinaFiltering();
