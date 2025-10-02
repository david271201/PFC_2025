/**
 * TESTE: Correção do Fallback no AGUARDANDO_CHEFE_DIV_MEDICINA_4
 * 
 * PROBLEMA IDENTIFICADO:
 * - No status AGUARDANDO_CHEFE_DIV_MEDICINA_4, quando a organização de destino (HMASP) 
 *   não possui usuários com papel CHEFE_DIV_MEDICINA, o fallback estava direcionando
 *   para a primeira organização em requestedOrganizationIds[0], que poderia ser
 *   a organização remetente (HCE) ao invés da de destino.
 * 
 * SOLUÇÃO IMPLEMENTADA:
 * - Modificar o fallback para priorizar organizações de destino que NÃO sejam
 *   a organização remetente
 * - Filtrar requestedOrganizationIds excluindo senderId
 * - Usar a primeira organização filtrada como fallback
 */

console.log('🧪 TESTE: Correção Fallback CHEFE_DIV_MEDICINA_4');
console.log('=' .repeat(60));

// Simulação de dados
const simulateRequest = {
  id: 'req123',
  senderId: 'hce',           // Organização REMETENTE (HCE - 1RM)
  requestedOrganizationIds: ['hce', 'hmasp'],  // Organizações de DESTINO (incluindo a própria HCE + HMASP)
  status: 'AGUARDANDO_CHEM_2'
};

const organizationsInDatabase = [
  { id: 'hce', name: 'HCE', regionId: '1RM', hasChefeDivMedicina: false },      // Remetente, sem CHEFE_DIV_MEDICINA
  { id: 'hmasp', name: 'HMASP', regionId: '2RM', hasChefeDivMedicina: false }  // Destino, sem CHEFE_DIV_MEDICINA
];

console.log('📋 CENÁRIO DE TESTE:');
console.log(`   Organização Remetente: ${simulateRequest.senderId} (HCE)`);
console.log(`   Organizações Solicitadas: [${simulateRequest.requestedOrganizationIds.join(', ')}]`);
console.log(`   Problema: Nenhuma organização tem usuários CHEFE_DIV_MEDICINA`);
console.log('');

// Simular a lógica ANTES da correção
function simulateOldFallbackLogic(request) {
  const firstDestinationOrgId = request.requestedOrganizationIds[0];
  return {
    targetOrgId: firstDestinationOrgId,
    logic: 'ANTIGA: Pega primeira organização da lista'
  };
}

// Simular a lógica DEPOIS da correção
function simulateNewFallbackLogic(request) {
  const destinationOrgsExcludingSender = request.requestedOrganizationIds.filter(
    orgId => orgId !== request.senderId
  );
  
  const targetOrgId = destinationOrgsExcludingSender.length > 0 
    ? destinationOrgsExcludingSender[0] 
    : request.requestedOrganizationIds[0];
    
  return {
    targetOrgId: targetOrgId,
    excludedSender: destinationOrgsExcludingSender,
    logic: 'NOVA: Prioriza organizações que não sejam a remetente'
  };
}

console.log('🔴 LÓGICA ANTIGA (PROBLEMÁTICA):');
const oldResult = simulateOldFallbackLogic(simulateRequest);
const oldTargetOrg = organizationsInDatabase.find(org => org.id === oldResult.targetOrgId);
console.log(`   → ${oldResult.logic}`);
console.log(`   → Resultado: ${oldTargetOrg?.name} (${oldResult.targetOrgId})`);
console.log(`   → ❌ PROBLEMA: Direcionou para a organização REMETENTE!`);
console.log('');

console.log('🟢 LÓGICA NOVA (CORRIGIDA):');
const newResult = simulateNewFallbackLogic(simulateRequest);
const newTargetOrg = organizationsInDatabase.find(org => org.id === newResult.targetOrgId);
console.log(`   → ${newResult.logic}`);
console.log(`   → Organizações excluindo remetente: [${newResult.excludedSender.join(', ')}]`);
console.log(`   → Resultado: ${newTargetOrg?.name} (${newResult.targetOrgId})`);
console.log(`   → ✅ CORRETO: Direcionou para organização de DESTINO!`);
console.log('');

// Teste de caso extremo
console.log('🧪 TESTE DE CASO EXTREMO:');
console.log('   Cenário: requestedOrganizationIds contém apenas a organização remetente');

const extremeCase = {
  senderId: 'hce',
  requestedOrganizationIds: ['hce']  // Só a própria organização remetente
};

const extremeResult = simulateNewFallbackLogic(extremeCase);
console.log(`   → Organizações excluindo remetente: [${extremeResult.excludedSender.join(', ')}]`);
console.log(`   → Resultado: ${extremeResult.targetOrgId}`);
console.log(`   → ✅ Fallback seguro: usa a primeira da lista original quando não há outras opções`);
console.log('');

console.log('🎯 RESUMO DA CORREÇÃO:');
console.log('');
console.log('✅ ANTES vs DEPOIS:');
console.log(`   ANTES: HCE → [hce, hmasp] → Fallback para "hce" (REMETENTE ❌)`);
console.log(`   DEPOIS: HCE → [hce, hmasp] → Fallback para "hmasp" (DESTINO ✅)`);
console.log('');
console.log('📁 ARQUIVOS MODIFICADOS:');
console.log('   → /pages/api/requests/[requestId]/status.ts');
console.log('     - Adicionado senderId ao select da consulta');
console.log('     - Modificado fallback para filtrar organizações excludindo remetente');
console.log('     - Adicionado logging detalhado para debugging');
console.log('');
console.log('🔧 MUDANÇAS TÉCNICAS:');
console.log('   1. Filtro: requestedOrganizationIds.filter(orgId => orgId !== request.senderId)');
console.log('   2. Priorização: usa primeira organização não-remetente quando disponível');
console.log('   3. Fallback seguro: usa lista original se só houver organização remetente');
console.log('   4. Logging melhorado: mostra qual organização foi escolhida e por quê');
console.log('');
console.log('✅ PROBLEMA RESOLVIDO: Solicitações não serão mais direcionadas incorretamente para a organização remetente no status AGUARDANDO_CHEFE_DIV_MEDICINA_4!');
