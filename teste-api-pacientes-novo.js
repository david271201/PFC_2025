// Script para testar a API de pacientes
import { NextApiRequest, NextApiResponse } from 'next';

// Simulando uma requisição para testar a API
async function testarAPI() {
  console.log('🧪 Testando API de pacientes...\n');
  
  try {
    // Teste 1: Buscar todos os pacientes
    console.log('📄 Teste 1: Listando pacientes...');
    const response = await fetch('http://localhost:3000/api/admin/pacientes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('⚠️  API retornou 401 (não autenticado) - isso é esperado sem login');
    } else {
      const data = await response.json();
      console.log('Dados retornados:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
  
  console.log('\n✅ Teste da API concluído');
}

testarAPI();
