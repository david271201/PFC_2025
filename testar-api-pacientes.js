// Teste da API de pacientes
async function testarAPIPacientes() {
  try {
    console.log('🧪 Testando API de pacientes...\n');
    
    // Teste da API GET
    const response = await fetch('http://localhost:3000/api/admin/pacients?page=1&limit=10');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Dados retornados pela API:');
    console.log('Total de pacientes:', data.pacients?.length || 0);
    console.log('Paginação:', data.pagination);
    
    if (data.pacients && data.pacients.length > 0) {
      console.log('\n📋 Pacientes encontrados:');
      data.pacients.forEach((pacient, index) => {
        console.log(`${index + 1}. ${pacient.name}`);
        console.log(`   CPF: ${pacient.cpf}`);
        console.log(`   Prec CP: ${pacient.precCp}`);
        console.log(`   Posto/Graduação: ${pacient.rank}`);
        console.log(`   Tipo: ${pacient.isDependent ? 'Dependente' : 'Titular'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum paciente retornado pela API');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

// Aguardar 3 segundos para o servidor inicializar
setTimeout(testarAPIPacientes, 3000);
