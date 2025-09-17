import { useState } from 'react';
import Card from '@/components/common/card';
import Button from '@/components/common/button';
import { Role } from '@prisma/client';

type CustoProps = {
  id: string;
  descricao: string;
  valor: number;
  createdAt: string;
  usuario: {
    name: string;
  };
};

type CustosFormProps = {
  requestId: string;
  userRole: Role;
  isEditable: boolean;
  onCustoAdded?: () => void;
};

export default function CustosForm({ requestId, userRole, isEditable, onCustoAdded }: CustosFormProps) {
  const [custos, setCustos] = useState<CustoProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar custos existentes quando o componente é montado
  useState(() => {
    const fetchCustos = async () => {
      try {
        const response = await fetch(`/api/requests/${requestId}/custos`);
        if (!response.ok) {
          throw new Error('Falha ao carregar custos');
        }
        const data = await response.json();
        setCustos(data);
      } catch (error) {
        setError('Erro ao carregar custos');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustos();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/requests/${requestId}/custos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar custo');
      }

      // Limpar o formulário
      setFormData({
        descricao: '',
        valor: 0
      });

      // Recarregar custos
      const updatedCustos = await fetch(`/api/requests/${requestId}/custos`);
      const updatedData = await updatedCustos.json();
      setCustos(updatedData);

      // Notificar o componente pai que um custo foi adicionado
      if (onCustoAdded) {
        onCustoAdded();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao adicionar custo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'valor' ? parseFloat(value) : value,
    });
  };
  
  const handleDelete = async (custoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este custo?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/requests/${requestId}/custos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ custoId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir custo');
      }
      
      // Recarregar custos após exclusão
      const updatedCustos = await fetch(`/api/requests/${requestId}/custos`);
      const updatedData = await updatedCustos.json();
      setCustos(updatedData);
      
      // Notificar o componente pai que houve alteração
      if (onCustoAdded) {
        onCustoAdded();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao excluir custo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center items-center h-20">
          <p>Carregando custos...</p>
        </div>
      </Card>
    );
  }

  const valorTotal = custos.reduce((total, custo) => total + custo.valor, 0);

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold text-grafite mb-4">Custos da Solicitação</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulário para adicionar custos */}
      {isEditable && userRole === Role.OPERADOR_FUSEX && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                id="valor"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Custo'}
            </Button>
          </div>
        </form>
      )}

      {/* Lista de custos */}
      {custos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Descrição</th>
                <th className="py-2 px-4 border-b text-right">Valor</th>
                <th className="py-2 px-4 border-b text-left">Adicionado por</th>
                <th className="py-2 px-4 border-b text-left">Data</th>
                {isEditable && userRole === Role.OPERADOR_FUSEX && (
                  <th className="py-2 px-4 border-b text-center">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {custos.map((custo) => (
                <tr key={custo.id}>
                  <td className="py-2 px-4 border-b">{custo.descricao}</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(custo.valor)}</td>
                  <td className="py-2 px-4 border-b">{custo.usuario.name}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(custo.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  {isEditable && userRole === Role.OPERADOR_FUSEX && (
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(custo.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Excluir este custo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td className="py-2 px-4 border-t">Total</td>
                <td className="py-2 px-4 border-t text-right">{formatCurrency(valorTotal)}</td>
                <td colSpan={isEditable && userRole === Role.OPERADOR_FUSEX ? 3 : 2} className="border-t"></td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Nenhum custo registrado para esta solicitação.</p>
      )}
    </Card>
  );
}
