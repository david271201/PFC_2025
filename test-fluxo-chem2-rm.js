// Script para testar a nova lógica de comparação de RM após CHEM_2
console.log('🧪 TESTE: Nova lógica de fluxo após CHEM_2 baseada em comparação de RM');
console.log('');

// Simulação da função helper
function getNextStatusAfterChem2(originRegionId, destinationRegionIds) {
  const sameRegion = destinationRegionIds.some(destRegion => destRegion === originRegionId);
  
  if (sameRegion) {
    return 'AGUARDANDO_CHEFE_DIV_MEDICINA_4';
  } else {
    return 'AGUARDANDO_SUBDIRETOR_SAUDE_1';
  }
}

// Cenários de teste baseados nas organizações fornecidas
const cenarios = [
  {
    nome: 'CASO 1: RM IGUAIS - PMPV (1RM) → HCE (1RM)',
    originRM: '1RM',
    destinationRMs: ['1RM'],
    esperado: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
  },
  {
    nome: 'CASO 2: RM DIFERENTES - PMPV (1RM) → HMASP (2RM)',
    originRM: '1RM', 
    destinationRMs: ['2RM'],
    esperado: 'AGUARDANDO_SUBDIRETOR_SAUDE_1'
  },
  {
    nome: 'CASO 3: RM DIFERENTES - HCE (1RM) → HMASP (2RM)',
    originRM: '1RM',
    destinationRMs: ['2RM'],  
    esperado: 'AGUARDANDO_SUBDIRETOR_SAUDE_1'
  },
  {
    nome: 'CASO 4: RM IGUAIS - HMASP (2RM) → HMASP (2RM)',
    originRM: '2RM',
    destinationRMs: ['2RM'],
    esperado: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
  },
  {
    nome: 'CASO 5: MÚLTIPLOS DESTINOS IGUAIS - 1RM → [1RM, 1RM]',
    originRM: '1RM',
    destinationRMs: ['1RM', '1RM'],
    esperado: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4'
  },
  {
    nome: 'CASO 6: MÚLTIPLOS DESTINOS MISTOS - 1RM → [1RM, 2RM]',  
    originRM: '1RM',
    destinationRMs: ['1RM', '2RM'],
    esperado: 'AGUARDANDO_CHEFE_DIV_MEDICINA_4' // Pelo menos uma RM igual
  }
];

console.log('📋 EXECUTANDO TESTES:');
console.log('');

let testesPassaram = 0;
let totalTestes = cenarios.length;

cenarios.forEach((cenario, index) => {
  const resultado = getNextStatusAfterChem2(cenario.originRM, cenario.destinationRMs);
  const passou = resultado === cenario.esperado;
  
  console.log(`${index + 1}. ${cenario.nome}`);
  console.log(`   Origin: ${cenario.originRM}`);
  console.log(`   Destinations: [${cenario.destinationRMs.join(', ')}]`);
  console.log(`   Esperado: ${cenario.esperado}`);
  console.log(`   Resultado: ${resultado}`);
  console.log(`   Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log('');
  
  if (passou) testesPassaram++;
});

console.log('📊 RESUMO DOS TESTES:');
console.log(`✅ Testes que passaram: ${testesPassaram}/${totalTestes}`);
console.log(`❌ Testes que falharam: ${totalTestes - testesPassaram}/${totalTestes}`);
console.log(`🎯 Taxa de sucesso: ${Math.round((testesPassaram / totalTestes) * 100)}%`);
console.log('');

if (testesPassaram === totalTestes) {
  console.log('🎉 TODOS OS TESTES PASSARAM! A lógica está funcionando corretamente.');
} else {
  console.log('⚠️  ALGUNS TESTES FALHARAM. Revisar implementação.');
}

console.log('');
console.log('🔍 EXPLICAÇÃO DA LÓGICA:');
console.log('');
console.log('1. RM IGUAIS (pelo menos uma destino = origem):');
console.log('   CHEM_2 → CHEFE_DIV_MEDICINA_4 → CHEFE_SECAO_REGIONAL_3 → OPERADOR_FUSEX_REALIZACAO');
console.log('');
console.log('2. RM DIFERENTES (nenhuma destino = origem):');
console.log('   CHEM_2 → SUBDIRETOR_SAUDE_1 → DRAS → SUBDIRETOR_SAUDE_2 → CHEFE_DIV_MEDICINA_4');
console.log('');
console.log('📋 DADOS DAS ORGANIZAÇÕES USADAS NO TESTE:');
console.log('- PMPV: 1RM (Policlínica Militar da Praia Vermelha)');
console.log('- HCE: 1RM (Hospital Central do Exército)');  
console.log('- HMASP: 2RM (Hospital Militar de Área de São Paulo)');
