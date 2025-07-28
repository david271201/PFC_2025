import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CustoFormProps {
  onSubmit: (descricao: string, valor: number) => Promise<boolean>;
}

type CustoInput = {
  id: number;
  descricao: string;
  valor: string;
};

export default function CustoForm({ onSubmit }: CustoFormProps) {
  const [custoInputs, setCustoInputs] = useState<CustoInput[]>([
    { id: 1, descricao: '', valor: '' }
  ]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const adicionarCampo = () => {
    const novoId = Math.max(0, ...custoInputs.map(c => c.id)) + 1;
    setCustoInputs([...custoInputs, { id: novoId, descricao: '', valor: '' }]);
  };

  const removerCampo = (id: number) => {
    if (custoInputs.length > 1) {
      setCustoInputs(custoInputs.filter(c => c.id !== id));
    }
  };

  const atualizarCampo = (id: number, campo: 'descricao' | 'valor', valor: string) => {
    setCustoInputs(
      custoInputs.map(custo => 
        custo.id === id 
          ? { 
              ...custo, 
              [campo]: campo === 'valor' 
                ? valor.replace(/[^\d,\.]/g, '') 
                : valor 
            } 
          : custo
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar mensagens
    setError('');
    setSuccess(false);
    
    // Validar todos os campos
    const custosInvalidos = custoInputs.filter(
      custo => !custo.descricao.trim() || !custo.valor.trim()
    );
    
    if (custosInvalidos.length > 0) {
      setError('Todos os campos de descrição e valor são obrigatórios');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Enviar cada custo para a API
      const promises = custoInputs.map(async (custo) => {
        const valorNumerico = parseFloat(custo.valor.replace(',', '.'));
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
          throw new Error(`Valor inválido para "${custo.descricao}"`);
        }
        return await onSubmit(custo.descricao, valorNumerico);
      });
      
      // Aguardar todas as requisições serem concluídas
      const resultados = await Promise.all(promises);
      
      if (resultados.every(r => r === true)) {
        // Sucesso - limpar o formulário e mostrar mensagem de sucesso
        setCustoInputs([{ id: 1, descricao: '', valor: '' }]);
        setSuccess(true);
        
        // Esconder a mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao adicionar os custos. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-red-100 p-2 text-red-700">{error}</div>
      )}
      
      {success && (
        <div className="rounded bg-green-100 p-2 text-green-700">
          Custos adicionados com sucesso!
        </div>
      )}
      
      {custoInputs.map((custo, index) => (
        <div key={custo.id} className="relative rounded-lg border border-gray-200 p-4">
          {custoInputs.length > 1 && (
            <button
              type="button"
              onClick={() => removerCampo(custo.id)}
              className="absolute right-2 top-2 rounded-full p-1 text-red-500 hover:bg-red-50"
              title="Remover este custo"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label 
                htmlFor={`descricao-${custo.id}`} 
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Descrição
              </label>
              <input
                type="text"
                id={`descricao-${custo.id}`}
                value={custo.descricao}
                onChange={(e) => atualizarCampo(custo.id, 'descricao', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-verde focus:outline-none focus:ring-1 focus:ring-verde"
                placeholder="Ex: Material de escritório"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label 
                htmlFor={`valor-${custo.id}`} 
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Valor (R$)
              </label>
              <input
                type="text"
                id={`valor-${custo.id}`}
                value={custo.valor}
                onChange={(e) => atualizarCampo(custo.id, 'valor', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-verde focus:outline-none focus:ring-1 focus:ring-verde"
                placeholder="Ex: 150,00"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={adicionarCampo}
          className="flex items-center gap-1 rounded-md border border-verde px-3 py-1 text-sm text-verde hover:bg-verde hover:text-white"
          disabled={isSubmitting}
        >
          <PlusIcon className="h-4 w-4" />
          Adicionar outro custo
        </button>
        
        <button
          type="submit"
          className="rounded-md bg-verde px-4 py-2 text-white hover:bg-verdeEscuro focus:outline-none focus:ring-2 focus:ring-verde focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adicionando...' : 'Salvar Custos'}
        </button>
      </div>
    </form>
  );
}
