/**
 * Utilitários para manipulação consistente de valores monetários em todo o sistema
 */

/**
 * Formata um valor numérico para exibição em formato de moeda brasileira (R$)
 * @param value Valor numérico a ser formatado (pode ser em centavos ou valor decimal)
 * @param inCents Se true, o valor está em centavos e precisa ser convertido para reais
 * @returns String formatada em reais (R$)
 */
export function formatCurrency(value: number, inCents: boolean = false): string {
  // Não precisamos mais converter de centavos para reais
  // Mantemos o parâmetro inCents para compatibilidade com código existente
  const realValue = value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(realValue);
}

/**
 * Estas funções foram mantidas para compatibilidade com código existente,
 * mas não realizam mais conversões agora que estamos armazenando valores decimais diretamente.
 */
export function toCents(value: number): number {
  return value; // Não convertemos mais para centavos
}

export function toReais(cents: number): number {
  return cents; // Não convertemos mais de centavos para reais
}

/**
 * Analisa um valor em formato de string e converte para número
 * Lida com valores em formato brasileiro (vírgula como separador decimal)
 * @param value String representando um valor monetário
 * @returns Valor numérico
 */
export function parseStringToNumber(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace('.', '').replace(',', '.'));
}
