// Script para verificar pacientes no banco de dados
import prisma from './prisma/prismaClient';

async function verificarPacientes() {
  try {
    console.log('🔍 Verificando pacientes no banco de dados...\n');

    // Buscar todos os pacientes
    const pacientes = await prisma.pacient.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Total de pacientes encontrados: ${pacientes.length}\n`);

    if (pacientes.length === 0) {
      console.log('❌ Nenhum paciente encontrado no banco de dados.');
      return;
    }

    // Mostrar detalhes dos pacientes
    console.log('👥 Lista de Pacientes:');
    console.log('═'.repeat(80));
    
    pacientes.forEach((paciente, index) => {
      console.log(`${index + 1}. ${paciente.name}`);
      console.log(`   📋 CPF: ${paciente.cpf}`);
      console.log(`   🎖️  Posto/Graduação: ${paciente.rank}`);
      console.log(`   📅 Criado em: ${new Date(paciente.createdAt).toLocaleDateString('pt-BR')}`);
      console.log('─'.repeat(60));
    });

    // Estatísticas adicionais
    console.log('\n📈 Estatísticas:');
    
    // Contar por posto/graduação
    const postosCounts = pacientes.reduce((acc, p) => {
      acc[p.rank] = (acc[p.rank] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🎖️  Distribuição por Posto/Graduação:');
    Object.entries(postosCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([posto, count]) => {
        console.log(`   ${posto}: ${count} paciente(s)`);
      });

    // Verificar se há pacientes com solicitações
    const pacientesComSolicitacoes = await prisma.pacient.findMany({
      include: {
        _count: {
          select: {
            requests: true
          }
        }
      },
      where: {
        requests: {
          some: {}
        }
      }
    });

    console.log(`\n📋 Pacientes com solicitações: ${pacientesComSolicitacoes.length}`);
    
    if (pacientesComSolicitacoes.length > 0) {
      console.log('\n👤 Pacientes que têm solicitações:');
      pacientesComSolicitacoes.forEach(p => {
        console.log(`   • ${p.name} (${p._count.requests} solicitação(ões))`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar pacientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
verificarPacientes();
