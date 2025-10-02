// Script para testar a correção do roteamento CHEFE_SECAO_REGIONAL
console.log('🧪 TESTE: Correção do roteamento CHEFE_SECAO_REGIONAL por status');
console.log('');

// Simulação da nova lógica baseada no tipo de usuário e status
function simulateChefSecaoRegionalFilter(userType, organizationsInDatabase) {
  // Se o usuário tem organizationId, é para AGUARDANDO_CHEFE_SECAO_REGIONAL_3
  if (userType.organizationId) {
    console.log(`📋 Usuário com organizationId: ${userType.organizationId} - Usa lógica específica para CHEFE_SECAO_REGIONAL_3`);
    return null; // Lógica especial não simulada aqui
  }
  
  // Se o usuário não tem organizationId, é para AGUARDANDO_CHEFE_SECAO_REGIONAL_1 e 2
  console.log(`📋 Usuário sem organizationId - Usa lógica de região de destino`);
  return organizationsInDatabase
    .filter(org => org.regionId === userType.regionId)
    .map(org => org.id);
}

// Simulação dos dados do banco
const organizationsInDatabase = [
  { id: 'pmpv', name: 'PMPV - Policlínica Militar da Praia Vermelha', regionId: '1RM' },
  { id: 'hce', name: 'HCE - Hospital Central do Exército', regionId: '1RM' },
  { id: 'hmasp', name: 'HMASP - Hospital Militar de Área de São Paulo', regionId: '2RM' }
];

// Cenários de usuários CHEFE_SECAO_REGIONAL
const usuariosChefes = [
  {
    nome: 'CHEFE_SECAO_REGIONAL da 1RM (para status 1 e 2)',
    role: 'CHEFE_SECAO_REGIONAL',
    regionId: '1RM',
    organizationId: null // Sem organizationId = status 1 e 2
  },
  {
    nome: 'CHEFE_SECAO_REGIONAL da 2RM (para status 1 e 2)',
    role: 'CHEFE_SECAO_REGIONAL', 
    regionId: '2RM',
    organizationId: null // Sem organizationId = status 1 e 2
  },
  {
    nome: 'CHEFE_SECAO_REGIONAL do PMPV (para status 3)',
    role: 'CHEFE_SECAO_REGIONAL',
    regionId: '1RM',
    organizationId: 'pmpv' // Com organizationId = status 3
  },
  {
    nome: 'CHEFE_SECAO_REGIONAL do HCE (para status 3)',
    role: 'CHEFE_SECAO_REGIONAL',
    regionId: '1RM',
    organizationId: 'hce' // Com organizationId = status 3
  }
];

// Simulação de solicitações
const solicitacoes = [
  {
    id: 'req1',
    senderId: 'pmpv', // 1RM
    requestedOrganizationIds: ['hce'], // 1RM
    status: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_1',
    description: 'PMPV (1RM) → HCE (1RM) - Status 1'
  },
  {
    id: 'req2', 
    senderId: 'pmpv', // 1RM
    requestedOrganizationIds: ['hmasp'], // 2RM
    status: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_2',
    description: 'PMPV (1RM) → HMASP (2RM) - Status 2'
  },
  {
    id: 'req3',
    senderId: 'hce', // 1RM
    requestedOrganizationIds: ['pmpv'], // 1RM
    status: 'AGUARDANDO_CHEFE_SECAO_REGIONAL_3',
    description: 'HCE (1RM) → PMPV (1RM) - Status 3'
  }
];

console.log('📋 TESTANDO CENÁRIOS:');
console.log('');

usuariosChefes.forEach((usuario, index) => {
  console.log(`CASO ${index + 1}: ${usuario.nome}`);
  
  const organizacoesVisiveisParaRegiao = simulateChefSecaoRegionalFilter(usuario, organizationsInDatabase);
  
  if (usuario.organizationId) {
    console.log('   → Usa lógica especial para AGUARDANDO_CHEFE_SECAO_REGIONAL_3 (não testada aqui)');
  } else {
    console.log(`   → Pode ver organizações da região ${usuario.regionId}: [${organizacoesVisiveisParaRegiao ? organizacoesVisiveisParaRegiao.join(', ') : 'nenhuma'}]`);
    
    solicitacoes.forEach(req => {
      // Para status 1 e 2, verifica se pelo menos uma organização solicitada está na região
      if (req.status.includes('CHEFE_SECAO_REGIONAL_1') || req.status.includes('CHEFE_SECAO_REGIONAL_2')) {
        const canSee = organizacoesVisiveisParaRegiao && req.requestedOrganizationIds.some(orgId => organizacoesVisiveisParaRegiao.includes(orgId));
        console.log(`   ✓ ${req.description}: ${canSee ? '🟢 DEVE VER' : '🔴 NÃO DEVE VER'}`);
      }
    });
  }
  
  console.log('');
});

console.log('🎯 RESULTADO ESPERADO:');
console.log('');
console.log('✅ CHEFE_SECAO_REGIONAL da 1RM (status 1 e 2):');
console.log('   - DEVE ver: PMPV → HCE (mesma região)');
console.log('   - NÃO deve ver: PMPV → HMASP (região diferente)');
console.log('');
console.log('✅ CHEFE_SECAO_REGIONAL da 2RM (status 1 e 2):');
console.log('   - DEVE ver: PMPV → HMASP (organizações da sua região)');
console.log('   - NÃO deve ver: PMPV → HCE (organizações de outra região)');
console.log('');
console.log('✅ CHEFE_SECAO_REGIONAL com organizationId (status 3):');
console.log('   - Usa lógica específica baseada na organização receptora');
console.log('   - NÃO afetado pela mudança (mantém comportamento existente)');
console.log('');
console.log('🔧 CORREÇÃO APLICADA:');
console.log('- CHEM: sempre usa lógica de região de destino');
console.log('- CHEFE_SECAO_REGIONAL sem organizationId: usa lógica de região de destino (status 1 e 2)');
console.log('- CHEFE_SECAO_REGIONAL com organizationId: usa lógica específica existente (status 3)');
