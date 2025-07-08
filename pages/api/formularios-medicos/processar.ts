import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  if (req.method === 'POST') {
    try {
      // Simular salvar no banco de dados
      console.log('Formulário recebido:', req.body);
      
      // Responder com sucesso
      return res.status(201).json({ 
        message: 'Formulário processado com sucesso',
        success: true,
        id: 'form_' + Date.now()
      });
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      return res.status(500).json({ message: 'Erro ao processar formulário', success: false });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
