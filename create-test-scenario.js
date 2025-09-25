const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestScenario() {
  console.log('🧪 Criando cenário de teste: operadorfusex@pmpv -> HCE...\n');

  try {
    // 1. Buscar o usuário operadorfusex@pmpv
    const operadorUser = await prisma.user.findFirst({
      where: {
        email: 'operadorfusex@pmpv'
      },
      include: {
        organization: true
      }
    });

    if (!operadorUser) {
      console.log('❌ Usuário operadorfusex@pmpv não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${operadorUser.name} (${operadorUser.organization.name})`);

    // 2. Buscar a organização HCE
    const hceOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { id: 'hce' },
          { name: { contains: 'HCE', mode: 'insensitive' } },
          { name: { contains: 'Hospital Central', mode: 'insensitive' } }
        ]
      }
    });

    if (!hceOrg) {
      console.log('❌ Organização HCE não encontrada');
      return;
    }

    console.log(`✅ Organização HCE encontrada: ${hceOrg.name} (ID: ${hceOrg.id})`);

    // 3. Buscar um paciente para a solicitação
    const pacient = await prisma.pacient.findFirst();
    if (!pacient) {
      console.log('❌ Nenhum paciente encontrado');
      return;
    }

    console.log(`✅ Paciente encontrado: ${pacient.name} (CPF: ${pacient.cpf})`);

    // 4. Criar uma nova solicitação
    const request = await prisma.request.create({
      data: {
        pacientCpf: pacient.cpf,
        senderId: operadorUser.organizationId,
        cbhpmCode: '10101012',
        needsCompanion: false,
        opmeCost: 50000, // R$ 500,00
        psaCost: 20000,  // R$ 200,00
        status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4', // Simular que já chegou neste status
        requestedOrganizationIds: [hceOrg.id] // HCE como destino
      }
    });

    console.log(`✅ Solicitação criada: ID ${request.id}`);
    console.log(`   📤 Remetente: ${operadorUser.organization.name}`);
    console.log(`   🎯 Destino: ${hceOrg.name}`);

    // 5. Criar respostas seguindo a lógica correta
    // Desmarcar todas as respostas existentes (se houver)
    await prisma.requestResponse.updateMany({
      where: {
        requestId: request.id,
      },
      data: {
        selected: false,
      },
    });

    // Criar uma resposta para HCE (organização de destino) e marcar como selecionada
    const hceResponse = await prisma.requestResponse.create({
      data: {
        requestId: request.id,
        receiverId: hceOrg.id,
        selected: true,
        status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
      }
    });

    console.log(`✅ Resposta criada para HCE: ID ${hceResponse.id} (selected: true)`);

    // Opcional: Criar uma resposta para PMPV (organização remetente) NÃO selecionada
    const pmpvResponse = await prisma.requestResponse.create({
      data: {
        requestId: request.id,
        receiverId: operadorUser.organizationId,
        selected: false,
        status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
      }
    });

    console.log(`✅ Resposta criada para PMPV: ID ${pmpvResponse.id} (selected: false)`);

    // 6. Testar o filtro
    console.log('\n🔍 Testando filtro para usuários CHEFE_DIV_MEDICINA...\n');

    // Buscar usuários CHEFE_DIV_MEDICINA do HCE
    const hceChefes = await prisma.user.findMany({
      where: {
        role: 'CHEFE_DIV_MEDICINA',
        organizationId: hceOrg.id
      }
    });

    console.log(`👥 Usuários CHEFE_DIV_MEDICINA do HCE: ${hceChefes.length}`);
    hceChefes.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Buscar usuários CHEFE_DIV_MEDICINA do PMPV
    const pmpvChefes = await prisma.user.findMany({
      where: {
        role: 'CHEFE_DIV_MEDICINA',
        organizationId: operadorUser.organizationId
      }
    });

    console.log(`👥 Usuários CHEFE_DIV_MEDICINA do PMPV: ${pmpvChefes.length}`);
    pmpvChefes.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Simular o filtro da API para usuários do HCE
    console.log('\n📊 Simulando filtro da API:');

    if (hceChefes.length > 0) {
      const hceUserOrg = hceOrg.id;
      console.log(`\nPara usuário CHEFE_DIV_MEDICINA do HCE (organizationId: ${hceUserOrg}):`);

      const filteredForHce = await prisma.request.findMany({
        where: {
          OR: [
            {
              status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
              requestResponses: {
                some: {
                  receiverId: hceUserOrg,
                  selected: true,
                  status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
                }
              }
            },
            {
              status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
              requestResponses: {
                some: {
                  receiverId: hceUserOrg,
                  selected: true,
                }
              }
            }
          ]
        }
      });

      console.log(`   ✅ Solicitações que apareceriam: ${filteredForHce.length}`);
      if (filteredForHce.some(r => r.id === request.id)) {
        console.log(`   ✅ A solicitação ${request.id} APARECERIA (correto)`);
      } else {
        console.log(`   ❌ A solicitação ${request.id} NÃO apareceria (incorreto)`);
      }
    }

    // Simular o filtro da API para usuários do PMPV
    if (pmpvChefes.length > 0) {
      const pmpvUserOrg = operadorUser.organizationId;
      console.log(`\nPara usuário CHEFE_DIV_MEDICINA do PMPV (organizationId: ${pmpvUserOrg}):`);

      const filteredForPmpv = await prisma.request.findMany({
        where: {
          OR: [
            {
              status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
              requestResponses: {
                some: {
                  receiverId: pmpvUserOrg,
                  selected: true,
                  status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
                }
              }
            },
            {
              status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
              requestResponses: {
                some: {
                  receiverId: pmpvUserOrg,
                  selected: true,
                }
              }
            }
          ]
        }
      });

      console.log(`   ✅ Solicitações que apareceriam: ${filteredForPmpv.length}`);
      if (filteredForPmpv.some(r => r.id === request.id)) {
        console.log(`   ❌ A solicitação ${request.id} APARECERIA (incorreto - não deveria)`);
      } else {
        console.log(`   ✅ A solicitação ${request.id} NÃO apareceria (correto)`);
      }
    }

    console.log(`\n✅ Cenário de teste criado com sucesso!`);
    console.log(`📝 Solicitação ID: ${request.id}`);
    console.log(`🗑️  Para limpar: DELETE FROM Request WHERE id = '${request.id}';`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestScenario();
