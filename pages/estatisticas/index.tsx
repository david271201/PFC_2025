import Button from '@/components/common/button';
import SpinLoading from '@/components/common/loading/SpinLoading';
import CountRanking from '@/components/stats/CountRanking';
import CustoStatsTable from '@/components/stats/CustoStatsTable';
import { cbhpmInfo } from '@/data/cbhpm/codes';
import fetcher from '@/fetcher';
import { checkPermission, UserType } from '@/permissions/utils';
import { auth } from '@@/auth';
import { GetServerSidePropsContext } from 'next';
import { useState, useEffect } from 'react';
import ReactSelect, { MultiValue } from 'react-select';
import useSWR from 'swr';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const regionOptions = Array(12)
  .fill(0)
  .map((_, index) => ({
    value: `${index + 1}RM`,
    label: `${index + 1}ª Região Militar`,
  }));

export default function StatsPage() {
  const [filters, setFilters] = useState<{
    region: {
      value: string;
      label: string;
    }[];
    organization: {
      value: string;
      label: string;
    }[];
  }>({
    region: [],
    organization: [],
  });

  const [isPrinting, setisPrinting] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  // Garantir renderização apenas no browser para gráficos
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const { data: organizations, isLoading: isLoadingOrganizations } = useSWR<
    {
      id: string;
      name: string;
    }[]
  >('/api/organizations', fetcher, {
    revalidateOnFocus: false,
  });

  const organizationOptions = organizations?.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const { data: statsData, isLoading: isLoadingStats } = useSWR<{
    requestsByOrganization: {
      id: string;
      name: string;
      _count: {
        sentRequests: number;
      };
    }[];
    requestsByRegion: {
      id: string;
      name: string;
      _count: {
        sentRequests: number;
      };
    }[];
    cbhpmRanking: {
      cbhpmCode: string;
      _count: {
        _all: number;
      };
    }[];
  }>(
    `/api/stats?${new URLSearchParams({
      // Encode base64 para evitar URLs muito longas
      regions: btoa(filters.region.map((filter) => filter.value).join(',')),
      organizations: btoa(
        filters.organization.map((filter) => filter.value).join(','),
      ),
    })}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const handleFilterChange = (
    newValue: MultiValue<{
      value: string;
      label: string;
    }>,
    filter: 'region' | 'organization',
  ) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filter]: newValue,
    }));
  };
  const cbhpmRanking = statsData?.cbhpmRanking.map((item) => {
    const cbhpm = cbhpmInfo.find((c) => c.id === item.cbhpmCode);

    return {
      id: item.cbhpmCode,
      name: cbhpm?.description || '',
      _count: {
        sentRequests: item._count._all,
      },
    };
  });

  // Configurações dos gráficos
  const regionChartData = {
    labels: statsData?.requestsByRegion.map(item => item.name) || [],
    datasets: [
      {
        label: 'Solicitações por Região',
        data: statsData?.requestsByRegion.map(item => item._count.sentRequests) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(255, 99, 255, 0.6)',
          'rgba(99, 255, 132, 0.6)',
          'rgba(255, 206, 132, 0.6)',
          'rgba(132, 255, 206, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)',
          'rgba(255, 206, 132, 1)',
          'rgba(132, 255, 206, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const organizationChartData = {
    labels: statsData?.requestsByOrganization.slice(0, 10).map(item => item.name) || [],
    datasets: [
      {
        label: 'Solicitações por OM',
        data: statsData?.requestsByOrganization.slice(0, 10).map(item => item._count.sentRequests) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const cbhpmChartData = {
    labels: cbhpmRanking?.slice(0, 10).map(item => item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name) || [],
    datasets: [
      {
        label: 'Procedimentos Mais Solicitados',
        data: cbhpmRanking?.slice(0, 10).map(item => item._count.sentRequests) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(255, 99, 255, 0.6)',
          'rgba(99, 255, 132, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Estatísticas de Solicitações',
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (isLoadingOrganizations || isLoadingStats) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-grafite">Estatísticas</h1>
        <div className="flex w-full items-center justify-center">
          <SpinLoading size={10} showText />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button
        onClick={() => {
          setisPrinting(true);
          setTimeout(() => {
            window.print();
            setisPrinting(false);
          }, 100);
        }}
        className="w-fit print:hidden"
      >
        Exportar relatório
      </Button>      <h1 className="text-2xl font-bold text-grafite">Estatísticas</h1>
      
      {/* Filtros */}
      <div className="flex items-center gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-grafite">Região:</span>
          <ReactSelect
            isMulti
            value={filters.region}
            options={regionOptions}
            onChange={(newValue) => handleFilterChange(newValue, 'region')}
            placeholder="Todas"
            className="min-w-44"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-grafite">OM:</span>
          <ReactSelect
            isMulti
            value={filters.organization}
            options={organizationOptions}
            onChange={(newValue) =>
              handleFilterChange(newValue, 'organization')
            }
            placeholder="Todas"
            className="min-w-44"
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className={`${isPrinting ? 'hidden' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-6 mb-6`}>
        {statsData?.requestsByRegion && statsData.requestsByRegion.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-grafite mb-4">Distribuição por Região</h3>
            <div className="h-64">
              {isBrowser ? (
                <Pie data={regionChartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
              )}
            </div>
          </div>
        )}

        {statsData?.requestsByOrganization && statsData.requestsByOrganization.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-grafite mb-4">Solicitações por OM</h3>
            <div className="h-64">
              {isBrowser ? (
                <Bar data={organizationChartData} options={barChartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
              )}
            </div>
          </div>
        )}

        {cbhpmRanking && cbhpmRanking.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-grafite mb-4">Procedimentos</h3>
            <div className="h-64">
              {isBrowser ? (
                <Doughnut data={cbhpmChartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
              )}
            </div>
          </div>
        )}
      </div>      {/* Tabelas */}
      <div
        className={`${isPrinting ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-2'} gap-6`}
      >
        {statsData?.requestsByRegion && (
          <div className="flex flex-col gap-2">
            <span className="font-bold text-grafite">Solicitações por RM:</span>
            <CountRanking
              entity="RM"
              ranking={statsData.requestsByRegion}
              isPrinting={isPrinting}
            />
          </div>
        )}
        {statsData?.requestsByOrganization && (
          <div className="flex flex-col gap-2">
            <span className="font-bold text-grafite">Solicitações por OM:</span>
            <CountRanking
              entity="OM"
              ranking={statsData.requestsByOrganization}
              isPrinting={isPrinting}
            />
          </div>
        )}
      </div>
        {cbhpmRanking && (
        <div className="flex flex-col gap-2 mt-6">
          <span className="font-bold text-grafite">
            Procedimentos mais solicitados:
          </span>
          <CountRanking
            entity="Procedimento"
            ranking={cbhpmRanking}
            isPrinting={isPrinting}
          />
        </div>
      )}

      {/* Tabela de Custos Médios */}
      <div className="mt-8">
        <CustoStatsTable 
          filters={filters}
          isPrinting={isPrinting}
        />
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await auth(context);
  const { role } = session?.user as UserType;

  if (!checkPermission(role, 'stats:read')) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      role,
    },
  };
}
