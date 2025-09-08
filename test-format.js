// Teste para verificar forma  console.log(`  - input/index (com ÷1000): ${formatCurrencyInput(valor)}`);}ação de moeda

// Função do utils.ts (sem dividir por 100)
function formatCurrencyUtils(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Função do input/index.tsx (divide por 1000)
function formatCurrencyInput(value) {
  const intValue = value || 0;
  return (intValue / 1000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Valores de teste (como vêm do banco em centavos)
const valores = [150000, 300000, 10000, 500000];

console.log('TESTE DE FORMATAÇÃO DE MOEDA\n');
console.log('Valores do banco (em centavos):');
valores.forEach(valor => {
  console.log(`\nValor no banco: ${valor}`);
  console.log(`  - utils.ts (sem /100):    ${formatCurrencyUtils(valor)}`);
  console.log(`  - input/index (com /100): ${formatCurrencyInput(valor)}`);
});

console.log('\n\nCOMPARAÇÃO COM VALORES ESPERADOS:');
console.log('Se 150000 no banco = R$ 150,00 real:');
console.log(`  - Função correta (÷1000): ${formatCurrencyInput(150000)}`);
console.log(`  - Função incorreta (sem divisão): ${formatCurrencyUtils(150000)}`);
