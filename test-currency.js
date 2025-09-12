// Simular as funções para teste
function formatCurrencyFromUtils(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatCurrencyFromInput(value) {
  const intValue = value || 0;
  return (intValue / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Testar com um valor do banco (em centavos)
const valorDoBanco = 150000; // R$ 1.500,00

console.log('=== TESTE DE FORMATAÇÃO DE MOEDA ===');
console.log(`Valor no banco: ${valorDoBanco} (centavos)`);
console.log('');
console.log('Usando formatCurrency do utils.ts (ANTIGO):');
console.log(`Resultado: ${formatCurrencyFromUtils(valorDoBanco)}`);
console.log('');
console.log('Usando formatCurrency do input/index.tsx (CORRETO):');
console.log(`Resultado: ${formatCurrencyFromInput(valorDoBanco)}`);
console.log('');
console.log('✅ A função correta para valores do banco é a do input/index.tsx');
console.log('✅ Ela divide por 100 para converter centavos em reais');
