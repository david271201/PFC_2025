import axios from 'axios';

const baseURL = 'http://localhost:3002';

// Configuração do axios
const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Lista de APIs para testar
const apis = [
  '/api/custos',
  '/api/requests',
  '/api/stats',
  '/api/responses',
  '/api/organizations',
  '/api/users',
  '/api/formularios-medicos',
  '/api/pacients',
];

async function testarAPI(endpoint: string) {
  try {
    console.log(`\n🧪 Testando ${endpoint}...`);
    const response = await api.get(endpoint);
    console.log(`✅ ${endpoint}: Status ${response.status}`);
    if (response.data) {
      console.log(`📊 Dados retornados: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }
    return { endpoint, status: response.status, success: true };
  } catch (error: any) {
    console.log(`❌ ${endpoint}: Erro ${error.response?.status || 'Sem resposta'}`);
    if (error.response?.data) {
      console.log(`📝 Mensagem de erro: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
    return { 
      endpoint, 
      status: error.response?.status || 'Sem resposta', 
      success: false,
      error: error.message 
    };
  }
}

async function executarTestes() {
  console.log('🚀 Iniciando testes das APIs corrigidas...\n');
  
  const resultados = [];
  
  for (const api of apis) {
    const resultado = await testarAPI(api);
    resultados.push(resultado);
    
    // Pequena pausa entre os testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('====================');
  
  const sucessos = resultados.filter(r => r.success);
  const erros = resultados.filter(r => !r.success);
  
  console.log(`✅ APIs funcionando: ${sucessos.length}`);
  console.log(`❌ APIs com erro: ${erros.length}`);
  
  if (sucessos.length > 0) {
    console.log('\n✅ APIs FUNCIONANDO:');
    sucessos.forEach(r => console.log(`  - ${r.endpoint} (${r.status})`));
  }
  
  if (erros.length > 0) {
    console.log('\n❌ APIs COM ERRO:');
    erros.forEach(r => console.log(`  - ${r.endpoint} (${r.status})`));
  }
  
  console.log('\n🎯 Teste concluído!');
}

// Executar os testes
executarTestes().catch(console.error);
