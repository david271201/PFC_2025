console.log('=== ANÁLISE DOS DADOS REAIS OPME ===\n');

// Dados das REQUESTS (valores em centavos no banco)
const requests = [
  { id: '6eb41934', opme: 10000, psa: 11000, region: '1ª RM' },
  { id: '0fc5847d', opme: 10000, psa: 10000, region: '1ª RM' },
  { id: '82b2a24e', opme: 10000, psa: 11000, region: '1ª RM' },
  { id: 'ff06a8dd', opme: 10000, psa: 10001, region: '1ª RM' },
  { id: '320b47e2', opme: 150000, psa: 50000, region: '1ª RM' },
  { id: '57d4f612', opme: 300000, psa: 100000, region: '1ª RM' },
  { id: 'f05372db', opme: 80000, psa: 30000, region: '2ª RM' },
  { id: 'a4a6a7ce', opme: 10000, psa: 11000, region: '1ª RM' },
  { id: '570402d9', opme: 10000, psa: 10100, region: '1ª RM' }
];

// Dados das RESPONSES (valores em centavos no banco)
const responses = [
  { id: 'a6674803', opme: 0, proc: 0, ticket: null, selected: false },
  { id: 'ee692a6b', opme: 101000, proc: 10000, ticket: null, selected: false },
  { id: '8e64b60f', opme: 11000, proc: 10000, ticket: null, selected: false },
  { id: '7902c059', opme: 0, proc: 0, ticket: null, selected: false },
  { id: 'd1435fef', opme: 10000, proc: 10000, ticket: null, selected: false },
  { id: '535909f7', opme: 69441, proc: 197997, ticket: 31063, selected: true },
  { id: '249d6948', opme: 95117, proc: 187040, ticket: 58923, selected: true },
  { id: 'ec3c4842', opme: 55848, proc: 255927, ticket: 26288, selected: true }
];

// Calcular total OPME de REQUESTS
let totalOpmeRequests = 0;
console.log('OPME das REQUESTS:');
requests.forEach(req => {
  console.log(`  ${req.id}: ${req.opme} (R$ ${(req.opme / 1000).toFixed(2)})`);
  totalOpmeRequests += req.opme;
});
console.log(`TOTAL REQUESTS: ${totalOpmeRequests} (R$ ${(totalOpmeRequests / 1000).toFixed(2)})\n`);

// Calcular total OPME de RESPONSES SELECIONADAS
let totalOpmeResponsesSelected = 0;
console.log('OPME das RESPONSES SELECIONADAS:');
responses.filter(resp => resp.selected).forEach(resp => {
  console.log(`  ${resp.id}: ${resp.opme} (R$ ${(resp.opme / 1000).toFixed(2)})`);
  totalOpmeResponsesSelected += resp.opme;
});
console.log(`TOTAL RESPONSES SELECIONADAS: ${totalOpmeResponsesSelected} (R$ ${(totalOpmeResponsesSelected / 1000).toFixed(2)})\n`);

// Calcular total OPME geral (como a API faz)
const totalOpmeGeral = totalOpmeRequests + totalOpmeResponsesSelected;
console.log('=== TOTAL OPME FINAL ===');
console.log(`Requests: ${totalOpmeRequests} (R$ ${(totalOpmeRequests / 1000).toFixed(2)})`);
console.log(`Responses Selected: ${totalOpmeResponsesSelected} (R$ ${(totalOpmeResponsesSelected / 1000).toFixed(2)})`);
console.log(`TOTAL GERAL: ${totalOpmeGeral} (R$ ${(totalOpmeGeral / 1000).toFixed(2)})`);

// Calcular por região
console.log('\n=== POR REGIÃO ===');

// 1ª RM
const requests1RM = requests.filter(r => r.region === '1ª RM');
const totalOpme1RM = requests1RM.reduce((sum, r) => sum + r.opme, 0);
console.log(`1ª RM - Requests: ${totalOpme1RM} (R$ ${(totalOpme1RM / 1000).toFixed(2)})`);

// 2ª RM  
const requests2RM = requests.filter(r => r.region === '2ª RM');
const totalOpme2RM = requests2RM.reduce((sum, r) => sum + r.opme, 0);
console.log(`2ª RM - Requests: ${totalOpme2RM} (R$ ${(totalOpme2RM / 1000).toFixed(2)})`);

// Total com responses (assumindo que todas as responses selecionadas são da 1ª RM)
const total1RMComResponses = totalOpme1RM + totalOpmeResponsesSelected;
console.log(`1ª RM + Responses Selected: ${total1RMComResponses} (R$ ${(total1RMComResponses / 1000).toFixed(2)})`);
