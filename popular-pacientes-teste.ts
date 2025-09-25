import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function popularPacientes() {
  try {
    console.log('🚀 Iniciando população de pacientes de teste...\n');
    
    // Verificar se já existem pacientes
    const existingCount = await prisma.pacient.count();
    console.log(`📊 Pacientes existentes no banco: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('✅ Já existem pacientes no banco. Listando os existentes:\n');
      
      const existing = await prisma.pacient.findMany({
        include: {
          _count: {
            select: {
              requests: true
            }
          }
        }
      });
      
      existing.forEach((pacient, index) => {
        console.log(`${index + 1}. ${pacient.name}`);
        console.log(`   CPF: ${pacient.cpf}`);
        console.log(`   Prec CP: ${pacient.precCp}`);
        console.log(`   Posto/Graduação: ${pacient.rank}`);
        console.log(`   Tipo: ${pacient.isDependent ? 'Dependente' : 'Titular'}`);
        console.log(`   Solicitações: ${pacient._count.requests}`);
        console.log('');
      });
      
      return;
    }
    
    // Pacientes de teste com as patentes corretas
    const pacientesDeTest = [
      {
        cpf: '12345678901',
        precCp: 'TEST001',
        name: 'João Silva Santos',
        rank: 'Capitão',
        isDependent: false
      },
      {
        cpf: '98765432109',
        precCp: 'TEST002', 
        name: 'Maria Fernanda Costa',
        rank: 'Dependente',
        isDependent: true
      },
      {
        cpf: '11122233344',
        precCp: 'TEST003',
        name: 'Pedro Oliveira Lima',
        rank: 'Major',
        isDependent: false
      },
      {
        cpf: '55566677788',
        precCp: 'TEST004',
        name: 'Ana Paula Rodrigues',
        rank: '1º Tenente',
        isDependent: false
      },
      {
        cpf: '99988877766',
        precCp: 'TEST005',
        name: 'Carlos Eduardo Nunes',
        rank: 'Tenente-Coronel',
        isDependent: false
      },
      {
        cpf: '12312312399',
        precCp: 'TEST006',
        name: 'Beatriz Santos Silva',
        rank: 'Dependente',
        isDependent: true
      },
      {
        cpf: '45645645677',
        precCp: 'TEST007',
        name: 'Roberto Carlos Almeida',
        rank: 'Coronel',
        isDependent: false
      },
      {
        cpf: '78978978911',
        precCp: 'TEST008',
        name: 'Lucia Maria Pereira',
        rank: '2º Tenente',
        isDependent: false
      }
    ];
    
    console.log('📝 Criando pacientes de teste...\n');
    
    for (const pacient of pacientesDeTest) {
      try {
        const created = await prisma.pacient.create({
          data: pacient
        });
        console.log(`✅ Paciente criado: ${created.name} (${created.rank})`);
      } catch (error: any) {
        console.log(`❌ Erro ao criar paciente ${pacient.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 População de pacientes concluída!');
    console.log('\n📊 Verificando total de pacientes:');
    
    const finalCount = await prisma.pacient.count();
    console.log(`Total de pacientes no banco: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Erro ao popular pacientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

popularPacientes();
