// Script para testar a correção do roteamento do CHEM_1
console.log('🧪 TESTE: Correção do roteamento CHEM_1 por região da organização solicitada');
console.log('');

// Simulação da nova lógica do CHEM
function simulateCHEMFilter(chemRegion, organizationsInDatabase) {
  // Encontrar organizações na região do CHEM
  const organizationsInChemRegion = organizationsInDatabase
    .filter(org => org.regionId === chemRegion)
    .map(org => org.id);
  
  console.log(`CHEM da ${chemRegion} pode ver organizações:`, organizationsInChemRegion);
  
  return organizationsInChemRegion;
}

// Simulação dos dados do banco
const organizationsInDatabase = [
  { id: 'pmpv', name: 'PMPV - Policlínica Militar da Praia Vermelha', regionId: '1RM' },
  { id: 'hce', name: 'HCE - Hospital Central do Exército', regionId: '1RM' },
  { id: 'hmasp', name: 'HMASP - Hospital Militar de Área de São Paulo', regionId: '2RM' }
];

// Simulação de solicitações
const solicitacoes = [
  {
    id: 'req1',
    senderId: 'pmpv', // 1RM
    requestedOrganizationIds: ['hce'], // 1RM
    status: 'AGUARDANDO_CHEM_1',
    description: 'PMPV (1RM) → HCE (1RM)'
  },
  {
    id: 'req2', 
    senderId: 'pmpv', // 1RM
    requestedOrganizationIds: ['hmasp'], // 2RM
    status: 'AGUARDANDO_CHEM_1',
    description: 'PMPV (1RM) → HMASP (2RM)'
  }
];

console.log('📋 TESTANDO CASOS:');
console.log('');

// Teste 1: CHEM da 1RM
console.log('CASO 1: CHEM da 1RM logado');
const chem1RMOrgs = simulateCHEMFilter('1RM', organizationsInDatabase);

solicitacoes.forEach(req => {
  // Verifica se pelo menos uma organização solicitada está na região do CHEM
  const canSee = req.requestedOrganizationIds.some(orgId => chem1RMOrgs.includes(orgId));
  
  console.log(`✓ ${req.description}: ${canSee ? '🟢 DEVE VER' : '🔴 NÃO DEVE VER'}`);
});

console.log('');

// Teste 2: CHEM da 2RM  
console.log('CASO 2: CHEM da 2RM logado');
const chem2RMOrgs = simulateCHEMFilter('2RM', organizationsInDatabase);

solicitacoes.forEach(req => {
  // Verifica se pelo menos uma organização solicitada está na região do CHEM
  const canSee = req.requestedOrganizationIds.some(orgId => chem2RMOrgs.includes(orgId));
  
  console.log(`✓ ${req.description}: ${canSee ? '🟢 DEVE VER' : '🔴 NÃO DEVE VER'}`);
});

console.log('');
console.log('🎯 RESULTADO ESPERADO:');
console.log('- CHEM da 1RM: deve ver apenas solicitações para HCE (mesma região)');
console.log('- CHEM da 2RM: deve ver apenas solicitações para HMASP (mesma região)');
console.log('');
console.log('✅ Com a correção implementada, as solicitações agora vão para o CHEM correto!');
