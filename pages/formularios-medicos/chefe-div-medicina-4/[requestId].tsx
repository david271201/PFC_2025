import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/card';
import Input, { formatCurrency } from '@/components/common/input';
import Button from '@/components/common/button';
import  SpinLoading  from '@/components/common/loading/SpinLoading';

type FormularioChefeDivMedicina4 = {
  id: string;
  requestId: string;
  parecerTecnico: string;
  observacoes: string;
  aprovado: boolean;
  createdAt: string;
  userId: string;
};

export default function FormularioChefeDivMedicina4() {
  const router = useRouter();
  const { requestId } = router.query;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parecerTecnico: '',
    observacoes: '',
    aprovado: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/formularios-medicos/chefe-div-medicina-4/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar formulário');
      }

      router.push(`/solicitacoes/${requestId}`);
    } catch (error) {
      console.error('Erro:', error);
      setError(error instanceof Error ? error.message : 'Erro ao enviar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <SpinLoading />
          <p className="mt-4 text-lg">Processando...</p>
        </div>
      </Layout>
    );
  }

  return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <h1 className="text-2xl font-bold text-grafite mb-6">Formulário Chefe Divisão Medicina 4</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="parecerTecnico" className="block text-sm font-medium text-grafite mb-2">
                Parecer Técnico
              </label>
              <textarea
                id="parecerTecnico"
                name="parecerTecnico"
                value={formData.parecerTecnico}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-verde focus:border-verde"
                rows={5}
              />
            </div>

            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-grafite mb-2">
                Observações
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-verde focus:border-verde"
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="aprovado"
                  checked={formData.aprovado}
                  onChange={handleChange}
                  className="h-4 w-4 text-verde focus:ring-verde border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-grafite">Aprovar solicitação</span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-verde text-white rounded hover:bg-verdeEscuro disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-cinzaClaro text-grafite rounded hover:bg-gray-300"
              >
                Voltar
              </button>
            </div>
          </form>
        </Card>
      </div>
  );
}
