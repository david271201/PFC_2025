// Script para verificar pacientes e suas solicitações detalhadamente
import prisma from './prisma/prismaClient';

async function verificarPacientesDetalhado() {
  try {
    console.log('🔍 Verificação detalhada de pacientes e solicitações...\n');

    // Buscar pacientes com suas solicitações
    const pacientesComSolicitacoes = await prisma.pacient.findMany({
      include: {
        requests: {
          include: {
            sender: {
              select: {
                name: true,
                region: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Total de pacientes: ${pacientesComSolicitacoes.length}\n`);

    pacientesComSolicitacoes.forEach((paciente, index) => {
      console.log(`${index + 1}. 👤 ${paciente.name}`);
      console.log(`   📋 CPF: ${paciente.cpf}`);
      console.log(`   🎖️  Posto/Graduação: ${paciente.rank}`);
      console.log(`   📊 Total de solicitações: ${paciente.requests.length}`);
      
      if (paciente.requests.length > 0) {
        console.log('   🔹 Solicitações:');
        paciente.requests.forEach((request, reqIndex) => {
          const dataFormatada = new Date(request.createdAt).toLocaleDateString('pt-BR');
          console.log(`      ${reqIndex + 1}. ID: ${request.id}`);
          console.log(`         📅 Data: ${dataFormatada}`);
          console.log(`         📊 Status: ${request.status}`);
          console.log(`         🏥 CBHPM: ${request.cbhpmCode}`);
          console.log(`         🏢 OM Solicitante: ${request.sender.name}`);
          console.log(`         🌍 Região: ${request.sender.region?.name || 'N/A'}`);
          if (reqIndex < paciente.requests.length - 1) {
            console.log('         ─'.repeat(30));
          }
        });
      } else {
        console.log('   ❌ Nenhuma solicitação');
      }
      
      console.log('═'.repeat(80));
    });

    // Resumo geral
    const totalSolicitacoes = pacientesComSolicitacoes.reduce((sum, p) => sum + p.requests.length, 0);
    console.log('\n📈 RESUMO GERAL:');
    console.log(`👥 Total de pacientes: ${pacientesComSolicitacoes.length}`);
    console.log(`📋 Total de solicitações: ${totalSolicitacoes}`);
    console.log(`📊 Média de solicitações por paciente: ${totalSolicitacoes > 0 ? (totalSolicitacoes / pacientesComSolicitacoes.length).toFixed(1) : 0}`);

  } catch (error) {
    console.error('❌ Erro ao verificar pacientes detalhado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
verificarPacientesDetalhado();
