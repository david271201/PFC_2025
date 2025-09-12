import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/currency';
import SpinLoading from '@/components/common/loading/SpinLoading';

interface CustoStats {
  id: string;
  name: string;
  regionName?: string;
  totalOPME: number;
  totalPSA: number;
  totalProcedure: number;
  totalTicket: number;
  totalGeral: number;
  quantidadeSolicitacoes: number;
  custoMedio: number;
}

interface CustoStatsData {
  custosPorRM: CustoStats[];
  custosPorOM: CustoStats[];
  resumoGeral: {
    totalOPME: number;
    totalPSA: number;
    totalProcedure: number;
    totalTicket: number;
    totalGeral: number;
    quantidadeSolicitacoes: number;
    custoMedio: number;
  };
}

interface CustoStatsTableProps {
  filters: {
    region: { value: string; label: string; }[];
    organization: { value: string; label: string; }[];
    startDate: string;
    endDate: string;
  };
  isPrinting: boolean;
}

export default function CustoStatsTable({ filters, isPrinting }: CustoStatsTableProps) {
  const [data, setData] = useState<CustoStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustoStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.region.length > 0) {
        params.append('regionIds', filters.region.map(r => r.value).join(','));
      }
      if (filters.organization.length > 0) {
        params.append('organizationIds', filters.organization.map(o => o.value).join(','));
      }

      const response = await fetch(`/api/stats/custos?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de custos');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustoStats();
  }, [filters]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-grafite mb-4">Custos Médios por Período</h3>
        <div className="flex justify-center py-8">
          <SpinLoading size={6} showText />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-grafite mb-4">Custos Médios por Período</h3>
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-grafite mb-4">Custos Médios de Solicitações por Período</h3>
      
      {data && (
        <div className="space-y-8">
          {/* Resumo Geral */}
          <div className="bg-verde/10 p-4 rounded-lg">
            <h4 className="font-semibold text-grafite mb-4">Resumo Geral das Solicitações</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-4">
              <div>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(data.resumoGeral.totalOPME, true)}
                </p>
                <p className="text-xs text-gray-600">OPME</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(data.resumoGeral.totalPSA, true)}
                </p>
                <p className="text-xs text-gray-600">PSA</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(data.resumoGeral.totalProcedure, true)}
                </p>
                <p className="text-xs text-gray-600">Procedimentos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-600">
                  {formatCurrency(data.resumoGeral.totalTicket, true)}
                </p>
                <p className="text-xs text-gray-600">Passagens</p>
              </div>
              <div>
                <p className="text-lg font-bold text-verde">
                  {formatCurrency(data.resumoGeral.totalGeral, true)}
                </p>
                <p className="text-xs text-gray-600">Total Geral</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-grafite">
                  {data.resumoGeral.quantidadeSolicitacoes}
                </p>
                <p className="text-sm text-gray-600">Solicitações</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-verde">
                  {formatCurrency(data.resumoGeral.custoMedio, true)}
                </p>
                <p className="text-sm text-gray-600">Custo Médio por Solicitação</p>
              </div>
            </div>
          </div>

          {/* Tabela de Custos por RM */}
          <div>
            <h4 className="font-semibold text-grafite mb-3">Custos Médios por Região Militar (RM)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Região Militar
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPME
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PSA
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedimentos
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passagens
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.custosPorRM.length > 0 ? (
                    data.custosPorRM.map((rm) => (
                      <tr key={rm.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rm.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-600 text-right">
                          {formatCurrency(rm.totalOPME, true)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-purple-600 text-right">
                          {formatCurrency(rm.totalPSA, true)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                          {formatCurrency(rm.totalProcedure, true)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-indigo-600 text-right">
                          {formatCurrency(rm.totalTicket, true)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(rm.totalGeral, true)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {rm.quantidadeSolicitacoes}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-verde text-right">
                          {formatCurrency(rm.custoMedio, true)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Nenhum dado encontrado para o período selecionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Custos por OM */}
          <div>
            <h4 className="font-semibold text-grafite mb-3">Custos Médios por Organização Militar (OM)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organização Militar
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Região
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPME
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PSA
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proc.
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pass.
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.custosPorOM.length > 0 ? (
                    data.custosPorOM.slice(0, isPrinting ? undefined : 10).map((om) => (
                      <tr key={om.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {om.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {om.regionName}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-xs text-blue-600 text-right">
                          {formatCurrency(om.totalOPME, true)}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-xs text-purple-600 text-right">
                          {formatCurrency(om.totalPSA, true)}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-xs text-orange-600 text-right">
                          {formatCurrency(om.totalProcedure, true)}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-xs text-indigo-600 text-right">
                          {formatCurrency(om.totalTicket, true)}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-xs text-gray-900 text-right font-semibold">
                          {formatCurrency(om.totalGeral, true)}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-xs text-gray-500 text-center">
                          {om.quantidadeSolicitacoes}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-verde text-right">
                          {formatCurrency(om.custoMedio, true)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        Nenhum dado encontrado para o período selecionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!isPrinting && data.custosPorOM.length > 10 && (
                <div className="mt-2 text-sm text-gray-500 text-center">
                  Mostrando top 10 organizações. Use os filtros para refinar a busca.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
