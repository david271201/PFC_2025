console.log('=== VERIFICAÇÃO MANUAL DE DADOS OPME ===\n');

// Simular os valores que estariam no banco
const dadosSimulados = {
  requests: [
    { id: 1, opmeCost: 150000, psaCost: 200000 },
    { id: 2, opmeCost: 300000, psaCost: 0 },
    { id: 3, opmeCost: 100000, psaCost: 150000 }
  ],
  responses: [
    { id: 1, requestId: 1, opmeCost: 50000, selected: true },
    { id: 2, requestId: 2, opmeCost: 75000, selected: true },
    { id: 3, requestId: 3, opmeCost: 0, selected: false }
  ]
};

console.log('DADOS SIMULADOS DO BANCO:\n');

console.log('REQUESTS:');
dadosSimulados.requests.forEach(req => {
  console.log(`  Request ${req.id}: OPME=${req.opmeCost} (R$ ${(req.opmeCost/1000).toFixed(2)}), PSA=${req.psaCost} (R$ ${(req.psaCost/1000).toFixed(2)})`);
});

console.log('\nRESPONSES:');
dadosSimulados.responses.forEach(resp => {
  console.log(`  Response ${resp.id} (Request ${resp.requestId}): OPME=${resp.opmeCost} (R$ ${(resp.opmeCost/1000).toFixed(2)}), Selected=${resp.selected}`);
});

console.log('\n=== CÁLCULO TOTAL OPME ===');

// Calcular total OPME como a API faz
let totalOPME = 0;

// Somar OPME das requests
dadosSimulados.requests.forEach(req => {
  totalOPME += req.opmeCost;
  console.log(`+ Request ${req.id}: ${req.opmeCost} (Total acumulado: ${totalOPME})`);
});

// Somar OPME das responses selecionadas
dadosSimulados.responses.forEach(resp => {
  if (resp.selected) {
    totalOPME += resp.opmeCost;
    console.log(`+ Response ${resp.id} (selected): ${resp.opmeCost} (Total acumulado: ${totalOPME})`);
  } else {
    console.log(`- Response ${resp.id} (NOT selected): ${resp.opmeCost} (Total permanece: ${totalOPME})`);
  }
});

console.log(`\nTOTAL OPME FINAL: ${totalOPME} (R$ ${(totalOPME/1000).toFixed(2)})`);

console.log('\n=== VERIFICAÇÃO POR REQUEST ===');
dadosSimulados.requests.forEach(req => {
  const responsesParaEsteRequest = dadosSimulados.responses.filter(resp => 
    resp.requestId === req.id && resp.selected
  );
  
  const opmeRequest = req.opmeCost;
  const opmeResponses = responsesParaEsteRequest.reduce((sum, resp) => sum + resp.opmeCost, 0);
  const opmeTotal = opmeRequest + opmeResponses;
  
  console.log(`Request ${req.id}:`);
  console.log(`  OPME Request: ${opmeRequest} (R$ ${(opmeRequest/1000).toFixed(2)})`);
  console.log(`  OPME Responses: ${opmeResponses} (R$ ${(opmeResponses/1000).toFixed(2)})`);
  console.log(`  OPME Total: ${opmeTotal} (R$ ${(opmeTotal/1000).toFixed(2)})`);
  console.log('');
});
