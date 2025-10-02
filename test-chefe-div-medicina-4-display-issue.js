/**
 * TESTE: Investigação do Problema de Exibição CHEFE_DIV_MEDICINA_4
 * 
 * PROBLEMA REPORTADO:
 * - No status AGUARDANDO_CHEFE_DIV_MEDICINA_4, a solicitação vai corretamente para a organização de destino (HMASP)
 * - Porém, para o CHEFE_DIV_MEDICINA do HMASP, a mesma solicitação aparece como "aprovada"
 * - Quando deveria aparecer como pendente para o CHEFE_DIV_MEDICINA do HMASP
 * 
 * HIPÓTESES:
 * 1. Problema na filtragem de solicitações por status na API /api/requests/index.ts
 * 2. Problema na lógica de `selected` nas requestResponses
 * 3. Problema na forma como o status é atualizado nas responses
 */

console.log('🔍 TESTE: Investigação do Problema CHEFE_DIV_MEDICINA_4');
console.log('=' .repeat(70));

// Simulação do cenário reportado
const cenarioTeste = {
  organizacoes: [
    { id: 'hce', name: 'HCE', regionId: '1RM' },
    { id: 'hmasp', name: 'HMASP', regionId: '2RM' }
  ],
  
  // Dados da solicitação
  solicitacao: {
    id: 'req-123',
    status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
    senderId: 'hce',           // Organização remetente
    requestedOrganizationIds: ['hce', 'hmasp'], // Organizações de destino
    description: 'HCE → HMASP'
  },
  
  // Responses criadas pelo sistema
  responses: [
    {
      id: 'resp-1',
      requestId: 'req-123',
      receiverId: 'hce',        // Response para HCE
      selected: false,          // NÃO selecionada (correto)
      status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
    },
    {
      id: 'resp-2', 
      requestId: 'req-123',
      receiverId: 'hmasp',      // Response para HMASP
      selected: true,           // SELECIONADA (correto)
      status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
    }
  ],
  
  // Usuários CHEFE_DIV_MEDICINA
  usuarios: [
    {
      id: 'user-hce',
      name: 'CHEFE_DIV_MEDICINA HCE',
      role: 'CHEFE_DIV_MEDICINA',
      organizationId: 'hce'
    },
    {
      id: 'user-hmasp',
      name: 'CHEFE_DIV_MEDICINA HMASP', 
      role: 'CHEFE_DIV_MEDICINA',
      organizationId: 'hmasp'
    }
  ]
};

console.log('📋 CENÁRIO DE TESTE:');
console.log(`   Solicitação: ${cenarioTeste.solicitacao.description}`);
console.log(`   Status: ${cenarioTeste.solicitacao.status}`);
console.log(`   Remetente: ${cenarioTeste.solicitacao.senderId}`);
console.log(`   Destinos: [${cenarioTeste.solicitacao.requestedOrganizationIds.join(', ')}]`);
console.log('');

// Simular a lógica de filtragem da API /api/requests/index.ts
function simularFiltroAPIRequests(usuario, solicitacao, responses) {
  console.log(`🔍 SIMULANDO FILTRO PARA: ${usuario.name} (${usuario.organizationId})`);
  
  // Lógica atual da API para CHEFE_DIV_MEDICINA (lógica padrão)
  // whereClause = {
  //   status: {
  //     in: statusesParaCHEFE_DIV_MEDICINA
  //   }
  // }
  
  const statusesParaChefeDivMedicina = ['AGUARDANDO_CHEFE_DIV_MEDICINA_4']; // Simplificado
  
  // 1. A solicitação é incluída no resultado se o status está na lista
  const solicitacaoIncluida = statusesParaChefeDivMedicina.includes(solicitacao.status);
  console.log(`   ✓ Solicitação incluída por status? ${solicitacaoIncluida ? 'SIM' : 'NÃO'}`);
  
  if (!solicitacaoIncluida) {
    console.log('   → Resultado: Solicitação NÃO aparece na lista');
    return { aparece: false, motivo: 'Status não corresponde ao papel' };
  }
  
  // 2. Verificar se a response selecionada está na organização do usuário
  const responseSelecionada = responses.find(r => r.requestId === solicitacao.id && r.selected === true);
  console.log(`   ✓ Response selecionada: ${responseSelecionada ? responseSelecionada.receiverId : 'NENHUMA'}`);
  
  if (responseSelecionada) {
    const éParaMinhaOrganizacao = responseSelecionada.receiverId === usuario.organizationId;
    console.log(`   ✓ Response é para minha organização (${usuario.organizationId})? ${éParaMinhaOrganizacao ? 'SIM' : 'NÃO'}`);
    
    if (éParaMinhaOrganizacao) {
      const statusDaResponse = responseSelecionada.status;
      console.log(`   ✓ Status da response: ${statusDaResponse}`);
      
      // ⭐ AQUI PODE ESTAR O PROBLEMA:
      // Se o status da response é AGUARDANDO_CHEFE_DIV_MEDICINA_4, deveria aparecer como PENDENTE
      // Se o status da response é diferente (ex: APROVADO), pode aparecer como APROVADO
      
      if (statusDaResponse === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4') {
        return { 
          aparece: true, 
          tipo: 'PENDENTE',
          motivo: 'Response selecionada na minha organização com status correto'
        };
      } else {
        return { 
          aparece: true, 
          tipo: 'APROVADO/PROCESSADO',
          motivo: `Response selecionada na minha organização mas status é ${statusDaResponse}`
        };
      }
    } else {
      return { 
        aparece: false, 
        motivo: `Response selecionada é para outra organização (${responseSelecionada.receiverId})`
      };
    }
  }
  
  return { aparece: false, motivo: 'Nenhuma response selecionada encontrada' };
}

// Testar para cada usuário
console.log('🧪 TESTANDO FILTROS:');
console.log('');

cenarioTeste.usuarios.forEach((usuario, index) => {
  console.log(`TESTE ${index + 1}: ${usuario.name}`);
  const resultado = simularFiltroAPIRequests(usuario, cenarioTeste.solicitacao, cenarioTeste.responses);
  
  console.log(`   → Aparece na lista: ${resultado.aparece ? 'SIM' : 'NÃO'}`);
  if (resultado.aparece) {
    console.log(`   → Tipo: ${resultado.tipo}`);
  }
  console.log(`   → Motivo: ${resultado.motivo}`);
  console.log('');
});

console.log('🔍 ANÁLISE DO PROBLEMA:');
console.log('');
console.log('✅ COMPORTAMENTO ESPERADO:');
console.log('   - CHEFE_DIV_MEDICINA HCE: NÃO deve ver (response não selecionada)');
console.log('   - CHEFE_DIV_MEDICINA HMASP: DEVE ver como PENDENTE (response selecionada + status correto)');
console.log('');

console.log('🚨 PROBLEMA REPORTADO:');
console.log('   - CHEFE_DIV_MEDICINA HMASP vê a solicitação como "APROVADA"');
console.log('   - Quando deveria ver como "PENDENTE"');
console.log('');

console.log('🔧 POSSÍVEIS CAUSAS:');
console.log('   1. Status da response está incorreto (não é AGUARDANDO_CHEFE_DIV_MEDICINA_4)');
console.log('   2. Lógica de exibição no frontend está interpretando errado o status');
console.log('   3. Há múltiplas responses conflitantes para a mesma organização');
console.log('   4. Status da solicitação principal está diferente do status das responses');
console.log('');

console.log('📋 INVESTIGAÇÕES RECOMENDADAS:');
console.log('   1. Verificar logs da API /api/requests/index.ts para CHEFE_DIV_MEDICINA');
console.log('   2. Verificar se as responses estão sendo criadas/atualizadas corretamente');
console.log('   3. Verificar se há inconsistência entre status da Request e RequestResponse');
console.log('   4. Verificar lógica de exibição no componente de lista de solicitações');
console.log('');

console.log('🎯 PRÓXIMOS PASSOS:');
console.log('   1. Executar query manual no banco para verificar dados reais');
console.log('   2. Adicionar logs detalhados na API de listagem');
console.log('   3. Verificar se o problema é na criação ou na leitura das responses');
