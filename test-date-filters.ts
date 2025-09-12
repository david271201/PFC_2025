// Teste dos filtros de data na página de estatísticas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDateFilters() {
  console.log('=== Teste dos Filtros de Data ===');

  try {
    // 1. Verificar total de requests no banco
    console.log('\n1. Total de requests no banco:');
    const totalRequests = await prisma.request.count();
    console.log(`Total: ${totalRequests} requests`);

    // 2. Verificar requests por data
    console.log('\n2. Requests por data:');
    const requestsByDate = await prisma.request.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    requestsByDate.forEach(item => {
      console.log(`${item.createdAt.toISOString().split('T')[0]}: ${item._count.id} requests`);
    });

    // 3. Testar filtro de data (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('\n3. Requests dos últimos 30 dias:');
    const recentRequests = await prisma.request.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    console.log(`Últimos 30 dias: ${recentRequests} requests`);

    // 4. Testar agrupamento por organização com filtro de data
    console.log('\n4. Organizações com mais requests (últimos 30 dias):');
    const orgStats = await prisma.organization.findMany({
      select: {
        name: true,
        _count: {
          select: {
            sentRequests: {
              where: {
                createdAt: {
                  gte: thirtyDaysAgo
                }
              }
            }
          }
        }
      },
      orderBy: {
        sentRequests: {
          _count: 'desc'
        }
      },
      take: 5
    });

    orgStats.forEach(org => {
      console.log(`${org.name}: ${org._count.sentRequests} requests`);
    });

    // 5. Testar agrupamento por CBHPM com filtro de data
    console.log('\n5. Códigos CBHPM mais solicitados (últimos 30 dias):');
    const cbhpmStats = await prisma.request.groupBy({
      by: ['cbhpmCode'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: { cbhpmCode: true },
      orderBy: { _count: { cbhpmCode: 'desc' } },
      take: 5
    });

    cbhpmStats.forEach(item => {
      console.log(`${item.cbhpmCode}: ${item._count?.cbhpmCode || 0} solicitações`);
    });

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateFilters();
