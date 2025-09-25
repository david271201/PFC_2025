import prisma from './prisma/prismaClient';

async function verificarPacientes() {
  try {
    console.log('🔍 Verificando pacientes no banco de dados...\n');
    
    // Buscar todos os pacientes
    const pacients = await prisma.pacient.findMany({
      include: {
        _count: {
          select: {
            requests: true
          }
        }
      }
    });
    
    console.log(`📊 Total de pacientes encontrados: ${pacients.length}\n`);
    
    if (pacients.length === 0) {
      console.log('❌ Nenhum paciente encontrado no banco de dados.');
      console.log('💡 Vamos criar alguns pacientes de teste...\n');
      
      // Criar pacientes de teste
      const pacientesDeTest = [
        {
          cpf: '12345678901',
          precCp: 'TEST001',
          name: 'João Silva',
          rank: 'Capitão',
          isDependent: false
        },
        {
          cpf: '98765432109',
          precCp: 'TEST002', 
          name: 'Maria Santos',
          rank: 'Dependente',
          isDependent: true
        },
        {
          cpf: '11122233344',
          precCp: 'TEST003',
          name: 'Pedro Oliveira',
          rank: 'Major',
          isDependent: false
        }
      ];
      
      for (const pacient of pacientesDeTest) {
        try {
          const created = await prisma.pacient.create({
            data: pacient
          });
          console.log(`✅ Paciente criado: ${created.name} (${created.cpf})`);
        } catch (error) {
          console.log(`❌ Erro ao criar paciente ${pacient.name}:`, error);
        }
      }
    } else {
      console.log('📋 Pacientes encontrados:');
      pacients.forEach((pacient, index) => {
        console.log(`${index + 1}. ${pacient.name}`);
        console.log(`   CPF: ${pacient.cpf}`);
        console.log(`   Prec CP: ${pacient.precCp}`);
        console.log(`   Posto/Graduação: ${pacient.rank}`);
        console.log(`   Tipo: ${pacient.isDependent ? 'Dependente' : 'Titular'}`);
        console.log(`   Solicitações: ${pacient._count.requests}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar pacientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPacientes();
