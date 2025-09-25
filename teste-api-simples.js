// Teste simples da API de pacientes
const fetch = require('node-fetch');

async function testarAPI() {
  console.log('🧪 Testando API de pacientes...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/pacientes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.status === 401) {
      console.log('✅ API respondeu corretamente (401 - não autenticado)');
      console.log('🔐 Isso significa que a API está funcionando e exige autenticação');
    } else {
      const data = await response.text();
      console.log('Resposta:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarAPI();
