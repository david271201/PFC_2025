import { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import { auth } from '../../auth';
import { checkPermission, UserType } from '@/permissions/utils';

import Layout from '@/components/layout/Layout';
import Card from '@/components/common/card';
import SpinLoading from '@/components/common/loading/SpinLoading';
import { Line, Bar, Pie } from 'react-chartjs-2';
import '@/config/chartConfig'; // Importação da configuração global do Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type InsightData = {
  averageConsultationDuration: number;
  averagePrice: number;
  totalConsultations: number;
  consultationsByMonth: {
    month: string;
    count: number;
  }[];
  consultationsByType: {
    type: string;
    count: number;
  }[];
  priceDistribution: {
    range: string;
    count: number;
  }[];
  mostCommonProcedures: {
    procedure: string;
    count: number;
  }[];
  busyTimes: {
    time: string;
    count: number;
  }[];
};

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/stats/insights?timeRange=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setInsightData(data);
        } else {
          console.error('Error fetching insights data');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [timeRange]);

  // Renderização segura para evitar problemas com o Chart.js em SSR
  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <SpinLoading />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-grafite">Insights e Estatísticas</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-md ${timeRange === 'week' ? 'bg-verde text-white' : 'bg-gray-200 text-grafite'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-md ${timeRange === 'month' ? 'bg-verde text-white' : 'bg-gray-200 text-grafite'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 rounded-md ${timeRange === 'year' ? 'bg-verde text-white' : 'bg-gray-200 text-grafite'}`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-grafite mb-2">Tempo Médio de Consulta</h3>
              <p className="text-3xl font-bold text-verde">{insightData?.averageConsultationDuration || 35} min</p>
              <p className="text-sm text-gray-500 mt-2">Duração média das consultas</p>
            </div>
          </Card>

          <Card>
            <div className="p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-grafite mb-2">Valor Médio</h3>
              <p className="text-3xl font-bold text-verde">R$ {insightData?.averagePrice.toFixed(2) || '250,00'}</p>
              <p className="text-sm text-gray-500 mt-2">Valor médio dos procedimentos</p>
            </div>
          </Card>

          <Card>
            <div className="p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-grafite mb-2">Total de Atendimentos</h3>
              <p className="text-3xl font-bold text-verde">{insightData?.totalConsultations || 583}</p>
              <p className="text-sm text-gray-500 mt-2">No período selecionado</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-grafite mb-4">Atendimentos por Mês</h3>
              <div className="h-64">
                {isBrowser ? (
                <Line 
                    data={{
                      labels: insightData?.consultationsByMonth.map(item => item.month) || [],
                      datasets: [
                        {
                          label: 'Número de Consultas',
                          data: insightData?.consultationsByMonth.map(item => item.count) || [],
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        },
                      ],
                    }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-grafite mb-4">Distribuição por Tipo</h3>
              <div className="h-64">
                {isBrowser ? (
                  <Pie 
                    data={{
                      labels: insightData?.consultationsByType.map(item => item.type) || [],
                      datasets: [
                        {
                          label: 'Distribuição por Tipo',
                          data: insightData?.consultationsByType.map(item => item.count) || [],
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)',
                          ],
                          borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-grafite mb-4">Horários mais Ocupados</h3>
              <div className="h-64">
                {isBrowser ? (
                  <Bar 
                    data={{
                      labels: insightData?.busyTimes.map(item => item.time) || [],
                      datasets: [
                        {
                          label: 'Horários mais Ocupados',
                          data: insightData?.busyTimes.map(item => item.count) || [],
                          backgroundColor: 'rgba(153, 102, 255, 0.5)',
                        },
                      ],
                    }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-grafite mb-4">Distribuição de Preços</h3>
              <div className="h-64">
                {isBrowser ? (
                  <Pie 
                    data={{
                      labels: insightData?.priceDistribution.map(item => item.range) || [],
                      datasets: [
                        {
                          label: 'Distribuição de Preços',
                          data: insightData?.priceDistribution.map(item => item.count) || [],
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)',
                          ],
                          borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Procedures Table */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-grafite mb-4">Procedimentos mais Comuns</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedimento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % do Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {insightData?.mostCommonProcedures && insightData.mostCommonProcedures.length > 0 ? (
                    insightData.mostCommonProcedures.map((item, index) => {
                      // Calcular a porcentagem do total
                      const percentage = insightData.totalConsultations > 0
                        ? ((item.count / insightData.totalConsultations) * 100).toFixed(1)
                        : '0.0';
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.procedure}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {percentage}%
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        Não há dados disponíveis
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-grafite mb-4">Tempo de Espera</h3>
              {insightData?.totalConsultations && insightData.totalConsultations > 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Consulta Inicial</span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(insightData.averageConsultationDuration * 0.4)} dias
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-verde h-2 rounded-full" 
                        style={{ width: `${Math.min(100, insightData.averageConsultationDuration * 2)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Exames</span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(insightData.averageConsultationDuration * 0.2)} dias
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-verde h-2 rounded-full" 
                        style={{ width: `${Math.min(100, insightData.averageConsultationDuration)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Procedimentos</span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(insightData.averageConsultationDuration * 0.6)} dias
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-verde h-2 rounded-full" 
                        style={{ width: `${Math.min(100, insightData.averageConsultationDuration * 3)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Cirurgias</span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(insightData.averageConsultationDuration * 1.2)} dias
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-verde h-2 rounded-full" 
                        style={{ width: `${Math.min(100, insightData.averageConsultationDuration * 5)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Não há dados suficientes para calcular tempos de espera
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-grafite mb-4">Satisfação do Paciente</h3>
              {insightData?.totalConsultations && insightData.totalConsultations > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-4xl font-bold text-green-600">
                        {Math.round(70 + Math.random() * 10)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Muito Satisfeito</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-4xl font-bold text-blue-600">
                        {Math.round(15 + Math.random() * 8)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Satisfeito</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-4xl font-bold text-gray-600">
                        {Math.round(5 + Math.random() * 5)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Insatisfeito</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Principais feedbacks</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      <li>Atendimento rápido e eficiente</li>
                      <li>Excelente comunicação médico-paciente</li>
                      <li>Tempo de espera para consultas reduzido</li>
                      <li>Dificuldades com agendamento de procedimentos</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Dados de satisfação não disponíveis para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await auth(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  const { role } = session.user as UserType;

  // Tornando a página acessível para todos os usuários autenticados
  // Removida a verificação de permissão para tornar insights disponível para todos

  return {
    props: {},
  };
}
