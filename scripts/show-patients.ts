import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showPatients() {
  try {
    console.log('📋 Pacientes no banco de dados:\n');
    
    const patients = await prisma.pacient.findMany({
      select: {
        cpf: true,
        name: true,
        rank: true,
        idade: true,
        sexo: true,
        isDependent: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name}`);
      console.log(`   CPF: ${patient.cpf}`);
      console.log(`   Patente: ${patient.rank}`);
      console.log(`   Idade: ${patient.idade} anos`);
      console.log(`   Sexo: ${patient.sexo}`);
      console.log(`   Dependente: ${patient.isDependent ? 'Sim' : 'Não'}`);
      console.log('');
    });

    console.log(`💯 Total: ${patients.length} pacientes cadastrados`);

  } catch (error) {
    console.error('❌ Erro ao buscar pacientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showPatients();
