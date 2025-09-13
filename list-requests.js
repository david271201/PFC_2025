const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listRequests() {
  try {
    // Verificar a quantidade total de solicitações
    const count = await prisma.request.count();
    console.log(`Total de solicitações no banco: ${count}`);
    
    // Listar as 5 primeiras solicitações
    if (count > 0) {
      const requests = await prisma.request.findMany({
        take: 5,
        include: {
          pacient: {
            select: {
              name: true,
              cpf: true,
              precCp: true,
              rank: true
            }
          }
        }
      });
      
      console.log('Primeiras 5 solicitações:');
      requests.forEach(req => {
        console.log(`\nID: ${req.id}`);
        console.log(`Descrição: ${req.description || 'N/A'}`);
        console.log(`Status: ${req.status}`);
        console.log(`Paciente: ${req.pacient.name} (CPF: ${req.pacient.cpf}, PrecCP: ${req.pacient.precCp})`);
        console.log(`Posto/Graduação: ${req.pacient.rank}`);
        console.log('-'.repeat(50));
      });
    }
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listRequests();
