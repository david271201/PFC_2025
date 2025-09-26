/**
 * Formata um valor numérico para exibição em formato de moeda brasileira (R$)
 * @param value Valor numérico a ser formatado (pode ser em centavos ou valor decimal)
 * @param inCents Se true, o valor está em centavos e precisa ser convertido para reais
 * @returns String formatada em reais (R$)
 */
export function formatCurrency(value: number, inCents: boolean = false): string {
  // Se o valor está em centavos, converte para reais
  const realValue = inCents ? value / 100 : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(realValue);
}

/**
 * Converte uma string formatada em moeda para um número
 * @param value String formatada em moeda (pode incluir R$, pontos e vírgulas)
 * @returns Número decimal
 */
export function parseStringToNumber(value: string): number {
  // Remove todos os caracteres exceto números e vírgula
  const cleanValue = value.replace(/[^\d,]/g, '');
  
  // Se não houver valor, retorna 0
  if (!cleanValue) return 0;
  
  // Converte a string para número, substituindo vírgula por ponto
  return parseFloat(cleanValue.replace(',', '.'));
}