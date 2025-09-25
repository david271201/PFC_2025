import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function testeCompletoCarregamentoPacientes() {
  try {
    console.log('🧪 TESTE COMPLETO: Carregamento de Pacientes\n');
    
    // 1. Verificar estrutura dos dados
    console.log('📊 1. Estrutura dos dados no banco:');
    const pacients = await prisma.pacient.findMany({
      include: {
        _count: {
          select: {
            requests: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`   Total de pacientes: ${pacients.length}`);
    
    if (pacients.length === 0) {
      console.log('   ❌ Nenhum paciente encontrado!\n');
      return;
    }
    
    console.log('   📋 Pacientes encontrados:');
    pacients.forEach((pacient, index) => {
      console.log(`   ${index + 1}. ${pacient.name}`);
      console.log(`      CPF: ${pacient.cpf}`);
      console.log(`      Prec CP: ${pacient.precCp}`);
      console.log(`      Posto: "${pacient.rank}"`);
      console.log(`      Dependente: ${pacient.isDependent}`);
      console.log(`      Solicitações: ${pacient._count.requests}`);
      console.log('');
    });
    
    // 2. Verificar se as patentes são válidas segundo o novo array
    console.log('🎖️ 2. Validação de patentes:');
    const MILITARY_RANKS = [
      '2º Tenente',
      'Segundo Tenente',
      '1º Tenente', 
      'Primeiro Tenente',
      'Capitão',
      'Major',
      'Tenente-Coronel',
      'Coronel',
      'General de Brigada',
      'General de Divisão',
      'General de Exército',
      'Marechal',
      'Dependente'
    ];
    
    const patentesInvalidas = [];
    pacients.forEach(pacient => {
      const isValid = MILITARY_RANKS.includes(pacient.rank);
      if (!isValid) {
        patentesInvalidas.push({ name: pacient.name, rank: pacient.rank });
      }
      console.log(`   "${pacient.rank}" → ${isValid ? '✅ Válida' : '❌ Inválida'}`);
    });
    
    if (patentesInvalidas.length > 0) {
      console.log('\n   ⚠️ Patentes inválidas encontradas:');
      patentesInvalidas.forEach(p => {
        console.log(`      ${p.name}: "${p.rank}"`);
      });
    } else {
      console.log('\n   ✅ Todas as patentes são válidas!');
    }
    
    // 3. Simular resposta da API
    console.log('\n📡 3. Simulação da resposta da API:');
    const apiResponse = {
      pacients: pacients,
      pagination: {
        page: 1,
        limit: 10,
        total: pacients.length,
        pages: Math.ceil(pacients.length / 10)
      }
    };
    
    console.log('   ✅ Estrutura da resposta:');
    console.log(`      pacients: array com ${apiResponse.pacients.length} itens`);
    console.log(`      pagination.total: ${apiResponse.pagination.total}`);
    console.log(`      pagination.pages: ${apiResponse.pagination.pages}`);
    
    // 4. Verificar filtros (simular filtros aplicados no frontend)
    console.log('\n🔍 4. Teste de filtros:');
    
    // Filtro por dependente
    const dependentes = pacients.filter(p => p.isDependent === true);
    const titulares = pacients.filter(p => p.isDependent === false);
    
    console.log(`   Dependentes: ${dependentes.length}`);
    console.log(`   Titulares: ${titulares.length}`);
    
    // 5. Debug específico do paciente mencionado
    console.log('\n🎯 5. Debug do paciente CPF 12345678901:');
    const pacienteEspecifico = pacients.find(p => p.cpf === '12345678901');
    
    if (pacienteEspecifico) {
      console.log('   ✅ Paciente encontrado:');
      console.log(`      Nome: "${pacienteEspecifico.name}"`);
      console.log(`      CPF: "${pacienteEspecifico.cpf}"`);
      console.log(`      Prec CP: "${pacienteEspecifico.precCp}"`);
      console.log(`      Posto: "${pacienteEspecifico.rank}"`);
      console.log(`      Dependente: ${pacienteEspecifico.isDependent}`);
      console.log(`      Solicitações: ${pacienteEspecifico._count.requests}`);
      
      // Verificar se seria incluído nos filtros padrão
      const incluirNoFiltro = MILITARY_RANKS.includes(pacienteEspecifico.rank);
      console.log(`      Incluído no filtro: ${incluirNoFiltro ? '✅ Sim' : '❌ Não'}`);
      
    } else {
      console.log('   ❌ Paciente CPF 12345678901 não encontrado');
    }
    
    // 6. Verificar configurações do frontend
    console.log('\n⚙️ 6. Possíveis problemas no frontend:');
    console.log('   • Verificar se a autenticação está funcionando');
    console.log('   • Verificar se o role SUBDIRETOR_SAUDE está correto');
    console.log('   • Verificar se há erros de JavaScript no console');
    console.log('   • Verificar se os filtros estão sendo aplicados incorretamente');
    console.log('   • Verificar se o estado dos pacientes está sendo atualizado');
    
    console.log('\n✅ Teste completo finalizado!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testeCompletoCarregamentoPacientes();
