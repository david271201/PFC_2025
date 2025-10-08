import { useState } from 'react';
import Button from '@/components/common/button';
import Card from '@/components/common/card';
import { Role } from '@prisma/client';
import SpinLoading from '@/components/common/loading/SpinLoading';

// Define TipoTransporte enum locally as it may not be exported from Prisma yet
type TipoTransporte = 'UTI' | 'RODOVIARIO' | 'AEREO' | 'AEROMEDICA';

interface TransportFormProps {
  requestId: string;
  userRole: Role;
  existingValorPassagem?: number | null;
  existingTipoTransporte?: TipoTransporte | null;
  isReadOnly?: boolean;
  onSaveSuccess?: () => void;
}

export default function TransportForm({ 
  requestId,
  userRole,
  existingValorPassagem,
  existingTipoTransporte,
  isReadOnly = false,
  onSaveSuccess
}: TransportFormProps) {
  const [valorPassagem, setValorPassagem] = useState<number | undefined>(
    existingValorPassagem || undefined
  );
  const [tipoTransporte, setTipoTransporte] = useState<TipoTransporte | undefined>(
    existingTipoTransporte || undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valorPassagem || !tipoTransporte) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/requests/passagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          valorPassagem,
          tipoTransporte,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar os dados de passagem');
      }

      alert('Dados de passagem salvos com sucesso');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar os dados de passagem');
      console.error('Erro ao salvar dados de passagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-4">
      <h2 className="text-xl font-bold text-grafite mb-4">
        {isReadOnly 
          ? 'Dados de Passagem' 
          : 'Preencher Dados de Passagem'}
      </h2>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row md:space-x-4 w-full">
            <div className="w-full md:w-1/2">
              <label 
                htmlFor="valorPassagem" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Valor da Passagem (R$)*
              </label>
              <input
                type="number"
                id="valorPassagem"
                name="valorPassagem"
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={valorPassagem || ''}
                onChange={(e) => setValorPassagem(parseFloat(e.target.value))}
                disabled={isReadOnly}
                required
              />
            </div>
            <div className="w-full md:w-1/2">
              <label 
                htmlFor="tipoTransporte" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tipo de Transporte*
              </label>
              <select
                id="tipoTransporte"
                name="tipoTransporte"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={tipoTransporte || ''}
                onChange={(e) => setTipoTransporte(e.target.value as TipoTransporte)}
                disabled={isReadOnly}
                required
              >
                <option value="">Selecione o tipo de transporte</option>
                <option value="UTI">UTI</option>
                <option value="RODOVIARIO">Rodoviário</option>
                <option value="AEREO">Aéreo</option>
                <option value="AEROMEDICA">Aeromédica</option>
              </select>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !valorPassagem || !tipoTransporte}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <SpinLoading size={4} />
                    <span className="ml-2">Salvando...</span>
                  </>
                ) : (
                  'Salvar Dados de Passagem'
                )}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}