import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestPatients() {
  try {
    console.log('🏥 Criando pacientes de teste com novas patentes...\n');
    
    const testPatients = [
      {
        cpf: '11111111111',
        precCp: 'TEST001',
        name: 'Soldado João da Silva',
        rank: 'Soldado',
        dataNascimento: new Date('1990-05-15'),
        sexo: 'Masculino',
        isDependent: false
      },
      {
        cpf: '22222222222',
        precCp: 'TEST002',
        name: 'Maria Santos',
        rank: 'Cabo',
        dataNascimento: new Date('1985-08-22'),
        sexo: 'Feminino',
        isDependent: false
      },
      {
        cpf: '33333333333',
        precCp: 'TEST003',
        name: 'Ana Oliveira',
        rank: 'Dependente',
        dataNascimento: new Date('1995-12-10'),
        sexo: 'Feminino',
        isDependent: true
      },
      {
        cpf: '44444444444',
        precCp: 'TEST004',
        name: 'Carlos Pereira',
        rank: 'Terceiro Sargento',
        dataNascimento: new Date('1980-03-07'),
        sexo: 'Masculino',
        isDependent: false
      }
    ];

    for (const patient of testPatients) {
      try {
        const created = await prisma.pacient.upsert({
          where: { cpf: patient.cpf },
          update: patient,
          create: patient
        });
        console.log(`✅ ${patient.name} - ${patient.rank}`);
      } catch (error) {
        console.log(`⚠️ Paciente ${patient.name} já existe ou erro: ${error}`);
      }
    }

    console.log('\n🎉 Pacientes de teste criados/atualizados com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatients();
