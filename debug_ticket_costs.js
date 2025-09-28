const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTicketCosts() {
  try {
    console.log('🔍 Investigando ticketCosts da solicitação: 7778129f-0093-4b88-b7d9-6e311c1687df\n');
    
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
    
    console.log('📋 Status da Solicitação:', request.status);
    console.log('');
    
    console.log('🧮 SIMULANDO A VALIDAÇÃO DO REQUESTFORM.TSX:');
    console.log('');
    
    // Simular a lógica do useEffect que popula ticketCosts
    const ticketCosts = request.requestResponses
      .filter(response => 
        !['REPROVADO', 'REPROVADO_DSAU', 'CANCELADO', 'APROVADO'].includes(response.status)
      )
      .map(response => ({
        responseId: response.id,
        cost: response.ticketCost || undefined, // Se null, vira undefined
      }));
    
    console.log('🎯 ticketCosts array criado no useEffect:');
    ticketCosts.forEach((ticket, index) => {
      console.log(`  ${index + 1}. responseId: ${ticket.responseId}`);
      console.log(`     cost: ${ticket.cost} (${typeof ticket.cost})`);
      console.log(`     undefined?: ${ticket.cost === undefined}`);
    });
    
    console.log('');
    console.log('⚡ VALIDAÇÃO: Algum ticketCost.cost === undefined?');
    const hasUndefined = ticketCosts.some(ticketCost => ticketCost.cost === undefined);
    console.log(`Result: ${hasUndefined}`);
    
    if (hasUndefined) {
      console.log('');
      console.log('🔴 ERRO CONFIRMADO!');
      console.log('- A validação vai falhar porque pelo menos um cost === undefined');
      console.log('- Isso acontece quando response.ticketCost é null no banco');
      console.log('- O || undefined converte null para undefined');
    }
    
    console.log('');
    console.log('🎯 SOLUÇÃO NECESSÁRIA:');
    console.log('1. Adicionar campos de interface para preenchimento de ticketCosts');
    console.log('2. OU inicializar os valores com 0 ao invés de undefined');
    console.log('3. OU ajustar a validação para aceitar null/undefined');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTicketCosts();
