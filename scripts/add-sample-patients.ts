import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const samplePatients = [
  {
    cpf: '11111111111',
    precCp: 'TC001',
    name: 'Ana Maria Santos',
    rank: 'Primeiro Sargento',
    dataNascimento: new Date('1975-03-15'),
    sexo: 'Feminino',
    isDependent: false
  },
  {
    cpf: '22222222222',
    precCp: 'MAJ002',
    name: 'Carlos Eduardo Lima',
    rank: 'Segundo Sargento',
    dataNascimento: new Date('1985-07-22'),
    sexo: 'Masculino',
    isDependent: false
  },
  {
    cpf: '33333333333',
    precCp: 'CAP003',
    name: 'Mariana Silva Rodrigues',
    rank: 'Cabo',
    dataNascimento: new Date('1990-11-08'),
    sexo: 'Feminino',
    isDependent: false
  },
  {
    cpf: '44444444444',
    precCp: 'DEP001',
    name: 'João Pedro Santos',
    rank: 'Dependente',
    dataNascimento: new Date('2011-05-12'),
    sexo: 'Masculino',
    isDependent: true
  },
  {
    cpf: '55555555555',
    precCp: 'PT001',
    name: 'Roberto Almeida Costa',
    rank: 'Soldado',
    dataNascimento: new Date('1995-09-18'),
    sexo: 'Masculino',
    isDependent: false
  }
];

async function addSamplePatients() {
  try {
    console.log('👥 Adicionando pacientes de exemplo...\n');
    
    for (const patient of samplePatients) {
      try {
        // Verificar se o paciente já existe
        const existing = await prisma.pacient.findUnique({
          where: { cpf: patient.cpf }
        });

        if (existing) {
          console.log(`⚠️  Paciente ${patient.name} já existe (CPF: ${patient.cpf})`);
          continue;
        }

        // Criar o paciente
        await prisma.pacient.create({
          data: patient
        });

        const age = new Date().getFullYear() - patient.dataNascimento.getFullYear();
        console.log(`✅ Criado: ${patient.name} (${patient.rank}) - ${age} anos, ${patient.sexo}`);
      } catch (error) {
        console.error(`❌ Erro ao criar ${patient.name}:`, error);
      }
    }

    console.log('\n🎉 Processo concluído!');
    
    // Mostrar estatísticas finais
    const totalPatients = await prisma.pacient.count();
    console.log(`📊 Total de pacientes no banco: ${totalPatients}`);

    const genderStats = await prisma.pacient.groupBy({
      by: ['sexo'],
      _count: {
        sexo: true
      }
    });

    console.log('\n📈 Distribuição por sexo:');
    genderStats.forEach(stat => {
      console.log(`   ${stat.sexo}: ${stat._count.sexo} pacientes`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSamplePatients();
