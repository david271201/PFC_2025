// Helper para verificar e sanitizar o requestId
export function sanitizeRequestId(requestId: any): string | null {
  // Verifica se existe
  if (!requestId) {
    console.warn('RequestId não fornecido');
    return null;
  }
  
  // Se for um array, pega o primeiro elemento
  if (Array.isArray(requestId)) {
    console.log('RequestId é um array, usando o primeiro elemento:', requestId[0]);
    return requestId[0];
  }
  
  // Se for uma string, retorna diretamente
  if (typeof requestId === 'string') {
    return requestId;
  }
  
  // Outros casos, tenta converter para string
  console.warn('Tipo não esperado para requestId:', typeof requestId);
  return String(requestId);
}