/**
 * Script simples para verificar se a lógica de filtro está correta
 */

console.log('🧪 Testando lógica de filtro CHEFE_DIV_MEDICINA_4...\n');

// Simulando dados de uma solicitação
const mockRequest = {
  id: 'test-123',
  status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4',
  senderId: 'pmpv', // PMPV é o remetente
  requestedOrganizationIds: ['hce'], // HCE é o destino
  requestResponses: [
    {
      id: 'resp-1',
      receiverId: 'hce', // Resposta para HCE
      selected: true,
      status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
    },
    {
      id: 'resp-2',
      receiverId: 'pmpv', // Resposta para PMPV
      selected: false,
      status: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
    }
  ]
};

// Simulando usuários CHEFE_DIV_MEDICINA
const hceUser = {
  organizationId: 'hce',
  role: 'CHEFE_DIV_MEDICINA',
  name: 'Chefe HCE'
};

const pmpvUser = {
  organizationId: 'pmpv',
  role: 'CHEFE_DIV_MEDICINA',
  name: 'Chefe PMPV'
};

// Função que simula o filtro da API
function shouldShowRequestForUser(request, user) {
  // Lógica atual da API
  const userOrganizationId = user.organizationId;
  
  // Para CHEFE_DIV_MEDICINA_4, verificar se:
  // 1. Status da solicitação é AGUARDANDO_CHEFE_DIV_MEDICINA_4
  // 2. Existe uma resposta selecionada para a organização do usuário
  
  if (request.status === 'AGUARDANDO_CHEFE_DIV_MEDICINA_4') {
    const selectedResponseForUser = request.requestResponses.find(resp => 
      resp.receiverId === userOrganizationId && resp.selected === true
    );
    
    return !!selectedResponseForUser;
  }
  
  return false;
}

// Testando para o usuário do HCE
console.log('👤 Testando para usuário CHEFE_DIV_MEDICINA do HCE:');
console.log(`   Organização: ${hceUser.organizationId}`);
const shouldShowForHce = shouldShowRequestForUser(mockRequest, hceUser);
console.log(`   Deveria aparecer? ${shouldShowForHce ? '✅ Sim' : '❌ Não'}`);
console.log(`   Está correto? ${shouldShowForHce ? '✅ Sim (HCE é o destino)' : '❌ Não, deveria aparecer'}`);

console.log('\n👤 Testando para usuário CHEFE_DIV_MEDICINA do PMPV:');
console.log(`   Organização: ${pmpvUser.organizationId}`);
const shouldShowForPmpv = shouldShowRequestForUser(mockRequest, pmpvUser);
console.log(`   Deveria aparecer? ${shouldShowForPmpv ? '✅ Sim' : '❌ Não'}`);
console.log(`   Está correto? ${!shouldShowForPmpv ? '✅ Sim (PMPV é o remetente, não deve aparecer)' : '❌ Não, não deveria aparecer'}`);

console.log('\n📊 Resumo:');
if (shouldShowForHce && !shouldShowForPmpv) {
  console.log('✅ CORREÇÃO FUNCIONOU: Aparece apenas para HCE (destino), não para PMPV (remetente)');
} else if (shouldShowForHce && shouldShowForPmpv) {
  console.log('❌ PROBLEMA AINDA EXISTE: Aparece para ambas as organizações');
} else if (!shouldShowForHce && !shouldShowForPmpv) {
  console.log('⚠️  POSSÍVEL PROBLEMA: Não aparece para nenhuma organização');
} else {
  console.log('❓ SITUAÇÃO INESPERADA');
}

console.log('\n🔍 Detalhes da resposta selecionada:');
const selectedResponse = mockRequest.requestResponses.find(r => r.selected);
if (selectedResponse) {
  console.log(`   Organização receptora: ${selectedResponse.receiverId}`);
  console.log(`   Está nas organizações de destino? ${mockRequest.requestedOrganizationIds.includes(selectedResponse.receiverId) ? '✅ Sim' : '❌ Não'}`);
} else {
  console.log('   ❌ Nenhuma resposta selecionada');
}
