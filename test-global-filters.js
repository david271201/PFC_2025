const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGlobalFilters() {
  console.log('🧪 Testando Filtros Globais de Data para Estatísticas\n');

  try {
    // 1. Verificar solicitações existentes
    const totalRequests = await prisma.request.count();
    console.log(`📊 Total de solicitações no banco: ${totalRequests}`);

    if (totalRequests === 0) {
      console.log('⚠️  Nenhuma solicitação encontrada. Criando dados de teste...');
      
      // Criar algumas solicitações de teste com datas diferentes
      const testRequests = [
        {
          cbhpmCode: '40101019',
          cbhpmVersion: '2024',
          opmeCost: 1500.00,
          psaCost: 300.00,
          pacientId: '1', // Assumindo que existe
          senderId: 'hce', // Assumindo que existe
          requestedOrganizationIds: ['hmasp'],
          createdAt: new Date('2024-01-15'), // 15 dias atrás
        },
        {
          cbhpmCode: '40101020',
          cbhpmVersion: '2024',
          opmeCost: 2000.00,
          psaCost: 400.00,
          pacientId: '1',
          senderId: 'hmasp',
          requestedOrganizationIds: ['hce'],
          createdAt: new Date('2024-02-01'), // 30 dias atrás
        },
        {
          cbhpmCode: '40101021',
          cbhpmVersion: '2024',
          opmeCost: 800.00,
          psaCost: 200.00,
          pacientId: '1',
          senderId: 'pmpv',
          requestedOrganizationIds: ['hce'],
          createdAt: new Date(), // Hoje
        }
      ];

      for (const request of testRequests) {
        try {
          await prisma.request.create({
            data: request
          });
          console.log(`✅ Solicitação criada: ${request.cbhpmCode} - ${request.createdAt.toISOString().split('T')[0]}`);
        } catch (error) {
          console.log(`⚠️  Erro ao criar solicitação: ${error.message}`);
        }
      }
    }

    // 2. Testar filtros de data
    console.log('\n📅 Testando filtros de data:');
    
    // Últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRequests = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        sender: {
          include: {
            region: true
          }
        }
      }
    });

    console.log(`📊 Solicitações dos últimos 30 dias: ${recentRequests.length}`);

    // 3. Testar agrupamento por organização (simulando a API)
    const statsByOrganization = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        region: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sentRequests: {
              where: {
                createdAt: {
                  gte: thirtyDaysAgo
                }
              }
            },
          },
        },
      },
      orderBy: {
        sentRequests: {
          _count: 'desc',
        },
      },
    });

    console.log('\n🏢 Estatísticas por organização (últimos 30 dias):');
    statsByOrganization.forEach(org => {
      console.log(`  - ${org.name} (${org.region?.name || 'Sem região'}): ${org._count.sentRequests} solicitações`);
    });

    // 4. Testar ranking CBHPM
    const cbhpmRanking = await prisma.request.groupBy({
      by: ['cbhpmCode'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        _all: true,
      },
    });

    const cbhpmRankingSorted = cbhpmRanking.sort(
      (a, b) => b._count._all - a._count._all,
    );

    console.log('\n🏥 Ranking CBHPM (últimos 30 dias):');
    cbhpmRankingSorted.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.cbhpmCode}: ${item._count._all} solicitações`);
    });

    console.log('\n✅ Teste de filtros globais concluído com sucesso!');
    console.log('\n📖 Como usar na interface:');
    console.log('1. Acesse: http://localhost:3000/estatisticas');
    console.log('2. Faça login como subdiretor@teste.com / 123456');
    console.log('3. Use os filtros de Data Inicial e Data Final');
    console.log('4. Combine com filtros de Região e OM');
    console.log('5. Clique em "Limpar Filtros" para resetar');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGlobalFilters();
