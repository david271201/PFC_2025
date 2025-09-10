import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useSession } from 'next-auth/react';
import { UserType } from '@/permissions/utils';
import CustoForm from '@/components/custos/CustoForm';
import { formatCurrency } from '@/utils';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type CustoItem = {
  id: string;
  descricao: string;
  valor: number;
  createdAt: string;
};

export default function CustosPage() {
  const { data: session } = useSession();
  const user = session?.user as UserType | undefined;
  const [custos, setCustos] = useState<CustoItem[]>([]);
  const [custosFiltrados, setCustosFiltrados] = useState<CustoItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros e paginação
  const [pesquisa, setPesquisa] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [ordenacao, setOrdenacao] = useState<{campo: 'descricao' | 'valor' | 'createdAt', direcao: 'asc' | 'desc'}>({
    campo: 'createdAt',
    direcao: 'desc'
  });
  
  // Estado para mostrar/esconder o formulário
  const [mostrarFormulario, setMostrarFormulario] = useState(true);

  // Buscar os custos da API
  const fetchCustos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/custos');
      setCustos(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar custos:', err);
      setError('Não foi possível carregar os custos. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar custos ao carregar a página
  useEffect(() => {
    fetchCustos();
  }, []);

  // Aplicar filtros e ordenação aos custos
  useEffect(() => {
    let resultado = [...custos];
    
    // Aplicar filtro de pesquisa
    if (pesquisa.trim()) {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(custo => 
        custo.descricao.toLowerCase().includes(termoPesquisa) || 
        formatCurrency(custo.valor).includes(termoPesquisa) ||
        new Date(custo.createdAt).toLocaleDateString('pt-BR').includes(termoPesquisa)
      );
    }
    
    // Aplicar ordenação
    resultado.sort((a, b) => {
      let valorA, valorB;
      
      if (ordenacao.campo === 'descricao') {
        valorA = a.descricao.toLowerCase();
        valorB = b.descricao.toLowerCase();
      } else if (ordenacao.campo === 'valor') {
        valorA = a.valor;
        valorB = b.valor;
      } else {
        valorA = new Date(a.createdAt).getTime();
        valorB = new Date(b.createdAt).getTime();
      }
      
      if (ordenacao.direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
    
    setCustosFiltrados(resultado);
  }, [custos, pesquisa, ordenacao]);

  // Calcular o total sempre que a lista de custos mudar
  useEffect(() => {
    const somaTotal = custos.reduce((soma, item) => soma + item.valor, 0);
    setTotal(somaTotal);
  }, [custos]);

  const adicionarCusto = async (descricao: string, valor: number) => {
    try {
      const response = await axios.post('/api/custos', { descricao, valor });
      setCustos((prevCustos) => [...prevCustos, response.data]);
      return true;
    } catch (err) {
      console.error('Erro ao adicionar custo:', err);
      setError('Não foi possível adicionar o custo. Tente novamente mais tarde.');
      return false;
    }
  };

  const removerCusto = async (id: string) => {
    try {
      await axios.delete(`/api/custos?id=${id}`);
      setCustos((prevCustos) => prevCustos.filter((custo) => custo.id !== id));
      setError(null);
    } catch (err) {
      console.error('Erro ao remover custo:', err);
      setError('Não foi possível remover o custo. Tente novamente mais tarde.');
    }
  };
  
  // Calcular índices para paginação
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensAtuais = custosFiltrados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(custosFiltrados.length / itensPorPagina);

  // Funções para navegação de páginas
  const irParaPagina = (numeroPagina: number) => {
    if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
      setPaginaAtual(numeroPagina);
    }
  }
  
  // Alternar direção de ordenação
  const alternarOrdenacao = (campo: 'descricao' | 'valor' | 'createdAt') => {
    if (ordenacao.campo === campo) {
      // Alternar direção se for o mesmo campo
      setOrdenacao({
        campo,
        direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Novo campo, começar com desc
      setOrdenacao({
        campo,
        direcao: 'desc'
      });
    }
  };
  
  // Limpar todos os filtros
  const limparFiltros = () => {
    setPesquisa('');
    setOrdenacao({
      campo: 'createdAt',
      direcao: 'desc'
    });
    setPaginaAtual(1);
  };

  return (
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">Lançamento de Custos</h1>
        
        {/* Seção de adição de custos - Colapsável */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between cursor-pointer mb-2" 
               onClick={() => setMostrarFormulario(!mostrarFormulario)}>
            <h2 className="text-xl font-semibold">Adicionar Novos Custos</h2>
            <button className="text-gray-500 hover:text-gray-700">
              {mostrarFormulario ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {mostrarFormulario && <CustoForm onSubmit={adicionarCusto} />}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Seção de visualização dos custos */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Histórico de Custos</h2>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchCustos}
                className="flex items-center gap-1 text-verde hover:text-verdeEscuro"
                title="Atualizar lista"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="rounded-md border border-gray-300 pl-9 pr-4 py-1.5 text-sm focus:border-verde focus:outline-none focus:ring-1 focus:ring-verde"
                />
                {pesquisa && (
                  <button 
                    onClick={() => setPesquisa('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Total de custos */}
          <div className="mb-4 rounded-lg border border-verde bg-verde/10 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-sm text-gray-600">Total de registros: {custosFiltrados.length}</span>
                {pesquisa && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">Filtro ativo</span>
                    <button 
                      onClick={limparFiltros}
                      className="text-xs text-verde hover:text-verdeEscuro underline"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700">Total Geral</span>
                <span className="text-xl font-bold text-verde">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          
          {/* Tabela de custos */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-verde"></div>
            </div>
          ) : custos.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">Nenhum custo lançado ainda.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-4 py-2 text-left text-sm font-medium text-gray-500 cursor-pointer"
                        onClick={() => alternarOrdenacao('descricao')}
                      >
                        <div className="flex items-center gap-1">
                          Descrição
                          {ordenacao.campo === 'descricao' && (
                            ordenacao.direcao === 'asc' ? 
                              <ChevronUpIcon className="h-4 w-4" /> : 
                              <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-sm font-medium text-gray-500 cursor-pointer"
                        onClick={() => alternarOrdenacao('valor')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Valor
                          {ordenacao.campo === 'valor' && (
                            ordenacao.direcao === 'asc' ? 
                              <ChevronUpIcon className="h-4 w-4" /> : 
                              <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-sm font-medium text-gray-500 cursor-pointer"
                        onClick={() => alternarOrdenacao('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Data
                          {ordenacao.campo === 'createdAt' && (
                            ordenacao.direcao === 'asc' ? 
                              <ChevronUpIcon className="h-4 w-4" /> : 
                              <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {itensAtuais.map((custo) => (
                      <tr key={custo.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{custo.descricao}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(custo.valor)}</td>
                        <td className="px-4 py-3">
                          {new Date(custo.createdAt).toLocaleDateString('pt-BR')}
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(custo.createdAt).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removerCusto(custo.id)}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {indexPrimeiroItem + 1} a {Math.min(indexUltimoItem, custosFiltrados.length)} de {custosFiltrados.length} registros
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => irParaPagina(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      className="rounded border border-gray-300 p-1 text-gray-500 disabled:opacity-50"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      // Calcular qual conjunto de páginas mostrar
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginaAtual <= 3) {
                        pageNum = i + 1;
                      } else if (paginaAtual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginaAtual - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => irParaPagina(pageNum)}
                          className={`h-8 w-8 rounded ${
                            paginaAtual === pageNum
                              ? 'bg-verde text-white'
                              : 'border border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => irParaPagina(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginas}
                      className="rounded border border-gray-300 p-1 text-gray-500 disabled:opacity-50"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
}
