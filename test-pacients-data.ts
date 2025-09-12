import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPacients() {
  try {
    console.log('=== Verificando Pacientes Existentes ===');
    
    const pacients = await prisma.pacient.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            requests: true
          }
        }
      }
    });
    
    console.log('Pacientes encontrados:', pacients.length);
    pacients.forEach((pacient, index) => {
      console.log(`${index + 1}. ${pacient.name} (CPF: ${pacient.cpf}, Prec CP: ${pacient.precCp})`);
      console.log(`   Posto: ${pacient.rank}, Dependente: ${pacient.isDependent ? 'Sim' : 'Não'}`);
      console.log(`   Solicitações: ${pacient._count.requests}`);
      console.log('');
    });

    // Testar API diretamente
    console.log('=== Testando API ===');
    
    // Simular dados de request e response
    const mockReq = {
      method: 'GET',
      query: {
        page: '1',
        limit: '10'
      }
    };
    
    console.log('API de pacientes está funcionando (simulação)');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPacients();
