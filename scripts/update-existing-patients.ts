import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dados realistas para atualizar pacientes existentes
const ageRanges = {
  // Idades baseadas em patentes militares típicas
  'Coronel': { min: 45, max: 55 },
  'Tenente-Coronel': { min: 40, max: 50 },
  'Major': { min: 35, max: 45 },
  'Capitão': { min: 30, max: 40 },
  'Primeiro Tenente': { min: 25, max: 35 },
  'Segundo Tenente': { min: 22, max: 30 },
  'General-de-Brigada': { min: 50, max: 60 },
  'General-de-Divisão': { min: 55, max: 65 },
  'General-de-Exército': { min: 60, max: 70 },
  'Marechal': { min: 65, max: 75 },
};

function getRandomAge(rank: string): number {
  const range = ageRanges[rank as keyof typeof ageRanges];
  if (!range) {
    // Idade padrão para patentes não mapeadas
    return Math.floor(Math.random() * (50 - 25)) + 25;
  }
  return Math.floor(Math.random() * (range.max - range.min)) + range.min;
}

function getRandomGender(): string {
  // Distribuição aproximadamente 70% masculino, 30% feminino (típico do meio militar)
  return Math.random() < 0.7 ? 'Masculino' : 'Feminino';
}

async function updateExistingPatients() {
  try {
    console.log('🔍 Buscando pacientes existentes sem idade ou sexo...');
    
    // Buscar pacientes que não têm idade ou sexo definidos
    const patients = await prisma.pacient.findMany({
      where: {
        OR: [
          { idade: null },
          { sexo: null }
        ]
      },
      select: {
        cpf: true,
        name: true,
        rank: true,
        idade: true,
        sexo: true
      }
    });

    console.log(`📊 Encontrados ${patients.length} pacientes para atualizar`);

    if (patients.length === 0) {
      console.log('✅ Todos os pacientes já possuem idade e sexo definidos!');
      return;
    }

    console.log('🔄 Atualizando pacientes...');

    let updateCount = 0;
    for (const patient of patients) {
      const updateData: { idade?: number; sexo?: string } = {};
      
      // Adicionar idade se não existir
      if (!patient.idade) {
        updateData.idade = getRandomAge(patient.rank);
      }
      
      // Adicionar sexo se não existir
      if (!patient.sexo) {
        updateData.sexo = getRandomGender();
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.pacient.update({
          where: { cpf: patient.cpf },
          data: updateData
        });

        console.log(`✅ Atualizado: ${patient.name} (${patient.rank}) - Idade: ${updateData.idade || patient.idade}, Sexo: ${updateData.sexo || patient.sexo}`);
        updateCount++;
      }
    }

    console.log(`🎉 Atualização concluída! ${updateCount} pacientes atualizados.`);

    // Mostrar estatísticas finais
    const finalStats = await prisma.pacient.groupBy({
      by: ['sexo'],
      _count: {
        sexo: true
      }
    });

    console.log('\n📈 Estatísticas finais por sexo:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.sexo}: ${stat._count.sexo} pacientes`);
    });

    // Estatísticas por faixa etária
    const ageStats = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN idade < 30 THEN '20-29'
          WHEN idade < 40 THEN '30-39'
          WHEN idade < 50 THEN '40-49'
          WHEN idade < 60 THEN '50-59'
          ELSE '60+'
        END as faixa_etaria,
        COUNT(*) as quantidade
      FROM "Pacient"
      WHERE idade IS NOT NULL
      GROUP BY 1
      ORDER BY 1
    `;

    console.log('\n📊 Estatísticas por faixa etária:');
    (ageStats as any[]).forEach(stat => {
      console.log(`   ${stat.faixa_etaria} anos: ${stat.quantidade} pacientes`);
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar pacientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
updateExistingPatients().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
