import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function testarAPIPacientes() {
  try {
    console.log('🔍 Testando problema de carregamento de pacientes...\n');
    
    // 1. Verificar se os pacientes estão no banco
    console.log('📊 1. Verificando pacientes no banco de dados:');
    const pacients = await prisma.pacient.findMany({
      include: {
        _count: {
          select: {
            requests: true
          }
        }
      }
    });
    
    console.log(`   Total encontrado: ${pacients.length}`);
    if (pacients.length > 0) {
      console.log('   ✅ Pacientes existem no banco\n');
      
      // Mostrar o paciente específico mencionado
      const pacienteEspecifico = pacients.find(p => p.cpf === '12345678901');
      if (pacienteEspecifico) {
        console.log('   🎯 Paciente CPF 12345678901 encontrado:');
        console.log(`      Nome: ${pacienteEspecifico.name}`);
        console.log(`      Prec CP: ${pacienteEspecifico.precCp}`);
        console.log(`      Posto: ${pacienteEspecifico.rank}`);
        console.log(`      Dependente: ${pacienteEspecifico.isDependent}`);
        console.log('');
      } else {
        console.log('   ❌ Paciente CPF 12345678901 não encontrado\n');
      }
    } else {
      console.log('   ❌ Nenhum paciente no banco\n');
      return;
    }
    
    // 2. Verificar usuários com role SUBDIRETOR_SAUDE
    console.log('👥 2. Verificando usuários SUBDIRETOR_SAUDE:');
    const subdirectors = await prisma.user.findMany({
      where: {
        role: Role.SUBDIRETOR_SAUDE
      }
    });
    
    console.log(`   Total encontrado: ${subdirectors.length}`);
    if (subdirectors.length === 0) {
      console.log('   ❌ Nenhum usuário SUBDIRETOR_SAUDE encontrado');
      console.log('   💡 Criando usuário de teste...\n');
      
      await prisma.user.create({
        data: {
          name: 'Subdiretor Teste',
          email: 'subdiretor@test.com',
          cpf: '00000000001',
          password: 'senha123',
          role: Role.SUBDIRETOR_SAUDE
        }
      });
      
      console.log('   ✅ Usuário SUBDIRETOR_SAUDE criado\n');
    } else {
      console.log('   ✅ Usuários SUBDIRETOR_SAUDE existem\n');
    }
    
    // 3. Testar a query diretamente (simular a API)
    console.log('🔧 3. Testando query da API diretamente:');
    
    const pageNumber = 1;
    const limitNumber = 10;
    const skip = (pageNumber - 1) * limitNumber;
    
    const [testPacients, total] = await Promise.all([
      prisma.pacient.findMany({
        skip,
        take: limitNumber,
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: {
              requests: true
            }
          }
        }
      }),
      prisma.pacient.count()
    ]);
    
    console.log(`   Query retornou: ${testPacients.length} pacientes`);
    console.log(`   Total no banco: ${total}`);
    
    if (testPacients.length > 0) {
      console.log('   ✅ Query da API está funcionando\n');
      
      console.log('📋 Pacientes retornados pela query:');
      testPacients.forEach((pacient, index) => {
        console.log(`   ${index + 1}. ${pacient.name} (CPF: ${pacient.cpf})`);
      });
      console.log('');
    } else {
      console.log('   ❌ Query da API não retornou pacientes\n');
    }
    
    // 4. Verificar estrutura de resposta
    console.log('📦 4. Estrutura de resposta da API:');
    const apiResponse = {
      pacients: testPacients,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    };
    
    console.log('   Estrutura:', JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarAPIPacientes();
