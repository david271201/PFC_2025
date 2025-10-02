// Script para testar a correção do roteamento OPERADOR_SECAO_REGIONAL
console.log('🧪 TESTE: Correção do roteamento OPERADOR_SECAO_REGIONAL por região da organização solicitada');
console.log('');

// Simulação da nova lógica do OPERADOR_SECAO_REGIONAL
function simulateOperadorSecaoRegionalFilter(operadorRegion, organizationsInDatabase) {
  // Busca organizações da mesma região do operador
  return organizationsInDatabase
    .filter(org => org.regionId === operadorRegion)
    .map(org => org.id);
}

// Simulação dos dados do banco
const organizationsInDatabase = [
  { id: 'pmpv', name: 'PMPV - Policlínica Militar da Praia Vermelha', regionId: '1RM' },
  { id: 'hce', name: 'HCE - Hospital Central do Exército', regionId: '1RM' },
  { id: 'hmasp', name: 'HMASP - Hospital Militar de Área de São Paulo', regionId: '2RM' },
  { id: 'hmrj', name: 'HMRJ - Hospital Militar do Rio de Janeiro', regionId: '1RM' }
];

// Simulação de solicitações
const solicitacoes = [
  {
    id: 'req1',
    senderId: 'pmpv', // 1RM
    requestedOrganizationIds: ['hce'], // 1RM
    status: 'AGUARDANDO_OPERADOR_SECAO_REGIONAL',
    description: 'PMPV (1RM) → HCE (1RM)'
  },
  {
    id: 'req2', 
    senderId: 'pmpv', // 1RM
    requestedOrganizationIds: ['hmasp'], // 2RM
    status: 'AGUARDANDO_OPERADOR_SECAO_REGIONAL',
    description: 'PMPV (1RM) → HMASP (2RM)'
  },
  {
    id: 'req3',
    senderId: 'hce', // 1RM
    requestedOrganizationIds: ['hmrj'], // 1RM
    status: 'AGUARDANDO_OPERADOR_SECAO_REGIONAL',
    description: 'HCE (1RM) → HMRJ (1RM)'
  },
  {
    id: 'req4',
    senderId: 'hmasp', // 2RM
    requestedOrganizationIds: ['pmpv'], // 1RM  
    status: 'AGUARDANDO_OPERADOR_SECAO_REGIONAL',
    description: 'HMASP (2RM) → PMPV (1RM)'
  }
];

console.log('📋 TESTANDO CENÁRIOS:');
console.log('');

// Teste 1: OPERADOR_SECAO_REGIONAL da 1RM
console.log('CASO 1: OPERADOR_SECAO_REGIONAL da 1RM logado');
const operador1RMOrgs = simulateOperadorSecaoRegionalFilter('1RM', organizationsInDatabase);
console.log(`   → Pode ver organizações da região 1RM: [${operador1RMOrgs.join(', ')}]`);

solicitacoes.forEach(req => {
  // Verifica se pelo menos uma organização solicitada está na região do OPERADOR
  const canSee = req.requestedOrganizationIds.some(orgId => operador1RMOrgs.includes(orgId));
  console.log(`   ✓ ${req.description}: ${canSee ? '🟢 DEVE VER' : '🔴 NÃO DEVE VER'}`);
});

console.log('');

// Teste 2: OPERADOR_SECAO_REGIONAL da 2RM  
console.log('CASO 2: OPERADOR_SECAO_REGIONAL da 2RM logado');
const operador2RMOrgs = simulateOperadorSecaoRegionalFilter('2RM', organizationsInDatabase);
console.log(`   → Pode ver organizações da região 2RM: [${operador2RMOrgs.join(', ')}]`);

solicitacoes.forEach(req => {
  // Verifica se pelo menos uma organização solicitada está na região do OPERADOR
  const canSee = req.requestedOrganizationIds.some(orgId => operador2RMOrgs.includes(orgId));
  console.log(`   ✓ ${req.description}: ${canSee ? '🟢 DEVE VER' : '🔴 NÃO DEVE VER'}`);
});

console.log('');
console.log('🎯 RESULTADO ESPERADO:');
console.log('');
console.log('✅ OPERADOR_SECAO_REGIONAL da 1RM:');
console.log('   - DEVE ver: PMPV → HCE, HCE → HMRJ, HMASP → PMPV (destino na sua região)');
console.log('   - NÃO deve ver: PMPV → HMASP (destino em outra região)');
console.log('');
console.log('✅ OPERADOR_SECAO_REGIONAL da 2RM:');
console.log('   - DEVE ver: PMPV → HMASP (destino na sua região)');
console.log('   - NÃO deve ver: PMPV → HCE, HCE → HMRJ, HMASP → PMPV (destino em outra região)');
console.log('');
console.log('🔧 CORREÇÃO APLICADA:');
console.log('- OPERADOR_SECAO_REGIONAL agora usa lógica de região de destino');
console.log('- Vê solicitações onde pelo menos UMA organização solicitada seja da sua região');
console.log('- Não importa a região da organização remetente');
console.log('');
console.log('📊 COMPARAÇÃO - ANTES vs DEPOIS:');
console.log('');
console.log('❌ ANTES (região do remetente):');
console.log('   OPERADOR_SECAO_REGIONAL da 1RM veria:');
console.log('   - PMPV → HCE ✓ (remetente 1RM)');
console.log('   - PMPV → HMASP ✓ (remetente 1RM) ← INCORRETO');
console.log('   - HCE → HMRJ ✓ (remetente 1RM)');
console.log('   - HMASP → PMPV ✗ (remetente 2RM) ← INCORRETO');
console.log('');
console.log('✅ DEPOIS (região do destino):');
console.log('   OPERADOR_SECAO_REGIONAL da 1RM vê:');
console.log('   - PMPV → HCE ✓ (destino 1RM) ← CORRETO');
console.log('   - PMPV → HMASP ✗ (destino 2RM) ← CORRETO');
console.log('   - HCE → HMRJ ✓ (destino 1RM) ← CORRETO');
console.log('   - HMASP → PMPV ✓ (destino 1RM) ← CORRETO');
