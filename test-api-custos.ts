import fetch from 'node-fetch';

async function testarAPICustos() {
  try {
    console.log('=== TESTE DA API DE CUSTOS ===\n');
    
    // Fazer requisição para a API de custos
    const response = await fetch('http://localhost:3000/api/stats/custos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Vou tentar sem autenticação primeiro para ver a resposta
      }
    });
    
    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 200) {
      const jsonData = JSON.parse(data);
      console.log('\n=== DADOS RETORNADOS PELA API ===');
      console.log('Total OPME:', jsonData.resumoGeral?.totalOPME);
      console.log('Total PSA:', jsonData.resumoGeral?.totalPSA);
      console.log('Total Geral:', jsonData.resumoGeral?.totalGeral);
      
      // Formatação com divisão por 1000
      if (jsonData.resumoGeral?.totalOPME) {
        console.log(`Total OPME formatado: R$ ${(jsonData.resumoGeral.totalOPME / 1000).toFixed(2)}`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao testar API:', error);
  }
}

testarAPICustos();
