import fetch from 'node-fetch';

async function testCostAPI() {
  try {
    console.log('Testando API de custos...');
    
    // Simular requisição à API
    const response = await fetch('http://localhost:3001/api/stats/custos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

  } catch (error) {
    console.error('Erro:', error);
  }
}

testCostAPI();
