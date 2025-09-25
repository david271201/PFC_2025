// Teste da funcionalidade de exportação Excel
// Este script testa a API de exportação e verifica se o arquivo é gerado corretamente

const https = require('https');
const http = require('http');
const fs = require('fs');
const { URL } = require('url');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: {
            get: (name) => res.headers[name.toLowerCase()]
          },
          buffer: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data.toString()))
        });
      });
    });
    
    req.on('error', reject);
  });
}

async function testExcelExport() {
  console.log('🧪 Testando exportação Excel...\n');

  try {
    // Teste 1: Exportação sem filtros
    console.log('📊 Teste 1: Exportação sem filtros');
    const params1 = new URLSearchParams({
      regions: btoa(''),
      organizations: btoa(''),
      startDate: '',
      endDate: ''
    });

    const response1 = await makeRequest(`http://localhost:3001/api/stats/export-excel?${params1.toString()}`);
    
    if (response1.ok) {
      console.log('✅ API respondeu com sucesso');
      console.log('📁 Content-Type:', response1.headers.get('content-type'));
      console.log('📄 Content-Disposition:', response1.headers.get('content-disposition'));
    } else {
      console.log('❌ Erro na API:', response1.status, response1.statusText);
    }

    // Teste 2: Exportação com filtros de data
    console.log('\n📊 Teste 2: Exportação com filtros de data');
    const params2 = new URLSearchParams({
      regions: btoa(''),
      organizations: btoa(''),
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });

    const response2 = await makeRequest(`http://localhost:3001/api/stats/export-excel?${params2.toString()}`);
    
    if (response2.ok) {
      console.log('✅ API com filtros de data respondeu com sucesso');
      
      // Salvar o arquivo para verificar
      const buffer = await response2.buffer();
      const filename = `test-export-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, buffer);
      console.log(`📥 Arquivo salvo como: ${filename}`);
      console.log(`📊 Tamanho do arquivo: ${buffer.length} bytes`);
      
      // Verificar se é um arquivo Excel válido
      if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
        console.log('✅ Arquivo parece ser um Excel válido (assinatura ZIP detectada)');
      } else {
        console.log('⚠️  Arquivo pode não ser um Excel válido');
      }
    } else {
      console.log('❌ Erro na API com filtros:', response2.status, response2.statusText);
    }

    // Teste 3: Verificar estrutura da resposta da API de stats
    console.log('\n📊 Teste 3: Verificando dados de estatísticas');
    const statsResponse = await makeRequest('http://localhost:3001/api/stats');
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ API de stats funcionando');
      console.log('📈 Dados disponíveis:');
      console.log(`   - Solicitações por região: ${statsData.requestsByRegion?.length || 0}`);
      console.log(`   - Solicitações por OM: ${statsData.requestsByOrganization?.length || 0}`);
      console.log(`   - Ranking CBHPM: ${statsData.cbhpmRanking?.length || 0}`);
    } else {
      console.log('❌ Erro na API de stats:', statsResponse.status);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }

  console.log('\n🎯 Teste concluído!');
}

function btoa(str) {
  return Buffer.from(str).toString('base64');
}

// Executar teste
testExcelExport();
