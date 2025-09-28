const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRequest() {
  try {
    console.log('🔍 Investigando solicitação: 7778129f-0093-4b88-b7d9-6e311c1687df\n');
    
    // Buscar a solicitação
    const request = await prisma.request.findUnique({
      where: {
        id: '7778129f-0093-4b88-b7d9-6e311c1687df'
      },
      include: {
        requestResponses: {
          include: {
            receiver: true
          }
        }
      }
    });
    
    if (!request) {
      console.log('❌ Solicitação não encontrada');
      return;
    }
    
    console.log('📋 DADOS DA SOLICITAÇÃO:');
    console.log('ID:', request.id);
    console.log('Status:', request.status);
    console.log('Data Criação:', request.createdAt);
    console.log('Total de Respostas:', request.requestResponses.length);
    console.log('');
    
    console.log('📊 RESPOSTAS (RequestResponses):');
    request.requestResponses.forEach((response, index) => {
      console.log(`\nResposta ${index + 1}:`);
      console.log('  ID:', response.id);
      console.log('  Status:', response.status);
      console.log('  Selecionada:', response.selected);
      console.log('  Custo Passagem (ticketCost):', response.ticketCost);
      console.log('  Organização Receptora:', response.receiver?.name || 'N/A');
    });
    
    console.log('\n🚨 ANÁLISE DO PROBLEMA:');
    
    // Verificar se está no status AGUARDANDO_PASSAGEM
    if (request.status === 'AGUARDANDO_PASSAGEM') {
      console.log('✅ Status correto para validação de ticketCosts: AGUARDANDO_PASSAGEM');
      
      // Verificar se há respostas com ticketCost undefined
      const responsesWithUndefinedTicket = request.requestResponses.filter(
        response => !['REPROVADO', 'REPROVADO_DSAU', 'CANCELADO', 'APROVADO'].includes(response.status) 
        && response.ticketCost === undefined
      );
      
      console.log(`\n📝 Respostas que precisam de ticketCost: ${responsesWithUndefinedTicket.length}`);
      
      responsesWithUndefinedTicket.forEach((response, index) => {
        console.log(`\nResposta ${index + 1} sem ticketCost:`);
        console.log('  ID:', response.id);
        console.log('  Status:', response.status);
        console.log('  Organização:', response.receiver?.name || 'N/A');
        console.log('  ticketCost atual:', response.ticketCost);
      });
      
      if (responsesWithUndefinedTicket.length > 0) {
        console.log('\n🔴 PROBLEMA IDENTIFICADO:');
        console.log('- Existem respostas que precisam ter o campo ticketCost preenchido');
        console.log('- Mas não há interface na tela para preenchê-los');
        console.log('- A validação falha porque ticketCost === undefined');
      }
    } else {
      console.log(`❌ Status atual: ${request.status} (não é AGUARDANDO_PASSAGEM)`);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRequest();
