// Simulação da lógica da API de custos para validar os cálculos

console.log('=== SIMULAÇÃO DA LÓGICA DA API ===\n');

// Dados reais do banco (obtidos do script anterior)
const requests = [
  { id: '6eb41934', opmeCost: 10000, psaCost: 11000, senderId: '1ª RM' },
  { id: '0fc5847d', opmeCost: 10000, psaCost: 10000, senderId: '1ª RM' },
  { id: '82b2a24e', opmeCost: 10000, psaCost: 11000, senderId: '1ª RM' },
  { id: 'ff06a8dd', opmeCost: 10000, psaCost: 10001, senderId: '1ª RM' },
  { id: '320b47e2', opmeCost: 150000, psaCost: 50000, senderId: '1ª RM' },
  { id: '57d4f612', opmeCost: 300000, psaCost: 100000, senderId: '1ª RM' },
  { id: 'f05372db', opmeCost: 80000, psaCost: 30000, senderId: '2ª RM' },
  { id: 'a4a6a7ce', opmeCost: 10000, psaCost: 11000, senderId: '1ª RM' },
  { id: '570402d9', opmeCost: 10000, psaCost: 10100, senderId: '1ª RM' }
];

const responses = [
  { id: 'a6674803', opmeCost: 0, procedureCost: 0, ticketCost: null, selected: false },
  { id: 'ee692a6b', opmeCost: 101000, procedureCost: 10000, ticketCost: null, selected: false },
  { id: '8e64b60f', opmeCost: 11000, procedureCost: 10000, ticketCost: null, selected: false },
  { id: '7902c059', opmeCost: 0, procedureCost: 0, ticketCost: null, selected: false },
  { id: 'd1435fef', opmeCost: 10000, procedureCost: 10000, ticketCost: null, selected: false },
  { id: '535909f7', opmeCost: 69441, procedureCost: 197997, ticketCost: 31063, selected: true },
  { id: '249d6948', opmeCost: 95117, procedureCost: 187040, ticketCost: 58923, selected: true },
  { id: 'ec3c4842', opmeCost: 55848, procedureCost: 255927, ticketCost: 26288, selected: true }
];

// Simular a lógica da API exatamente como está no código
let totalGeralOPME = 0;
let totalGeralPSA = 0;
let totalGeralProcedure = 0;
let totalGeralTicket = 0;
let quantidadeTotal = 0;

console.log('PROCESSANDO REQUESTS:');
requests.forEach(request => {
  console.log(`\nRequest ${request.id}:`);
  
  // Custos da solicitação principal
  const opmeCostRequest = request.opmeCost || 0;
  const psaCostRequest = request.psaCost || 0;
  
  console.log(`  OPME Request: ${opmeCostRequest}`);
  console.log(`  PSA Request: ${psaCostRequest}`);

  // Buscar responses selecionadas para esta request (simulação)
  const requestResponses = responses.filter(r => r.selected); // Para simplificar, assumindo que todas as selecionadas pertencem a requests
  
  // Custos das respostas selecionadas  
  let opmeCostResponse = 0;
  let procedureCostResponse = 0;
  let ticketCostResponse = 0;

  // Para esta simulação, vou dividir as responses igualmente entre as requests
  if (quantidadeTotal < 3) { // Apenas as 3 primeiras requests têm responses
    const responseIndex = quantidadeTotal;
    if (requestResponses[responseIndex]) {
      opmeCostResponse = requestResponses[responseIndex].opmeCost || 0;
      procedureCostResponse = requestResponses[responseIndex].procedureCost || 0;
      ticketCostResponse = requestResponses[responseIndex].ticketCost || 0;
      
      console.log(`  OPME Response: ${opmeCostResponse}`);
      console.log(`  Procedure Response: ${procedureCostResponse}`);
      console.log(`  Ticket Response: ${ticketCostResponse}`);
    }
  }

  // Atualizar totais gerais (como na API)
  totalGeralOPME += opmeCostRequest + opmeCostResponse;
  totalGeralPSA += psaCostRequest;
  totalGeralProcedure += procedureCostResponse;
  totalGeralTicket += ticketCostResponse;
  quantidadeTotal++;
  
  const totalRequest = opmeCostRequest + psaCostRequest + opmeCostResponse + procedureCostResponse + ticketCostResponse;
  console.log(`  TOTAL desta request: ${totalRequest}`);
});

console.log('\n=== TOTAIS FINAIS ===');
console.log(`Total OPME: ${totalGeralOPME} (R$ ${(totalGeralOPME / 1000).toFixed(2)})`);
console.log(`Total PSA: ${totalGeralPSA} (R$ ${(totalGeralPSA / 1000).toFixed(2)})`);
console.log(`Total Procedure: ${totalGeralProcedure} (R$ ${(totalGeralProcedure / 1000).toFixed(2)})`);
console.log(`Total Ticket: ${totalGeralTicket} (R$ ${(totalGeralTicket / 1000).toFixed(2)})`);

const totalGeralSolicitacoes = totalGeralOPME + totalGeralPSA + totalGeralProcedure + totalGeralTicket;
console.log(`Total Geral: ${totalGeralSolicitacoes} (R$ ${(totalGeralSolicitacoes / 1000).toFixed(2)})`);
console.log(`Quantidade de solicitações: ${quantidadeTotal}`);

// Comparar com o cálculo correto
console.log('\n=== COMPARAÇÃO ===');
const totalOPMECorreto = 590000 + 220406; // Requests + Selected Responses
console.log(`OPME Esperado: ${totalOPMECorreto} (R$ ${(totalOPMECorreto / 1000).toFixed(2)})`);
console.log(`OPME Calculado: ${totalGeralOPME} (R$ ${(totalGeralOPME / 1000).toFixed(2)})`);
console.log(`Diferença: ${totalGeralOPME - totalOPMECorreto}`);
