import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Endpoint simples para verificação de saúde da API
 * Útil para testes de conectividade e CORS
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permitir apenas GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }

  try {
    // Verificar conectividade com o banco de dados
    // Note que não estamos realmente testando o banco aqui para evitar overhead
    // Em uma implementação real, você pode querer fazer uma consulta simples

    // Resposta de sucesso
    return res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      api: 'formularios-medicos'
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    return res.status(500).json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido no servidor'
    });
  }
}