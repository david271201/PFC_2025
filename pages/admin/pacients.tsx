import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { Role } from '@prisma/client';
import { UserType } from '../../src/permissions/utils';
import Swal from 'sweetalert2';

// Patentes militares permitidas
const MILITARY_RANKS = [
  '2º Tenente',
  'Segundo Tenente', // Compatibilidade com dados existentes
  '1º Tenente', 
  'Primeiro Tenente', // Compatibilidade com dados existentes
  'Capitão',
  'Major',
  'Tenente-Coronel',
  'Coronel',
  'General de Brigada',
  'General de Divisão',
  'General de Exército',
  'Marechal',
  'Dependente'
] as const;

// Tipos
interface Pacient {
  cpf: string;
  precCp: string;
  name: string;
  rank: string;
  isDependent: boolean;
  _count: {
    requests: number;
  }
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PacientsResponse {
  pacients: Pacient[];
  pagination: PaginationInfo;
}

const PacientsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pacients, setPacients] = useState<Pacient[]>([]);
  const [filteredPacients, setFilteredPacients] = useState<Pacient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPacient, setNewPacient] = useState({
    cpf: '',
    precCp: '',
    name: '',
    rank: 'Dependente',
    isDependent: true,
  });
  const [editingPacient, setEditingPacient] = useState<Pacient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDependent, setFilterDependent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Verificar autenticação e permissão
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    const user = session?.user as UserType;
    if (user?.role !== Role.SUBDIRETOR_SAUDE) {
      router.push('/');
      return;
    }

    fetchPacients();
  }, [status, session, router, currentPage, itemsPerPage, searchTerm]);

  const fetchPacients = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      console.log('🔍 Fazendo requisição para:', `/api/admin/pacients?${params}`);
      
      const response = await fetch(`/api/admin/pacients?${params}`);
      
      console.log('📡 Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar pacientes');
      }
      
      const data: PacientsResponse = await response.json();
      console.log('📊 Dados recebidos:', data);
      console.log('📋 Número de pacientes:', data.pacients?.length || 0);
      
      setPacients(data.pacients);
      setPagination(data.pagination);
    } catch (err) {
      console.error('❌ Erro ao carregar pacientes:', err);
      setError('Erro ao carregar pacientes. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar e ordenar os pacientes localmente
  useEffect(() => {
    const filterPacients = () => {
      console.log('🔧 Aplicando filtros aos pacientes:', pacients.length, 'pacientes');
      
      let result = [...pacients];
      
      // Aplicar filtro por dependente
      if (filterDependent) {
        const isDependent = filterDependent === 'true';
        result = result.filter(pacient => pacient.isDependent === isDependent);
        console.log('🎯 Filtro dependente aplicado:', result.length, 'pacientes');
      }
      
      // Aplicar ordenação
      result.sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortField === 'cpf') {
          return sortDirection === 'asc'
            ? a.cpf.localeCompare(b.cpf)
            : b.cpf.localeCompare(a.cpf);
        } else if (sortField === 'rank') {
          return sortDirection === 'asc'
            ? a.rank.localeCompare(b.rank)
            : b.rank.localeCompare(a.rank);
        } else if (sortField === 'requests') {
          return sortDirection === 'asc'
            ? a._count.requests - b._count.requests
            : b._count.requests - a._count.requests;
        }
        
        return 0;
      });
      
      console.log('📋 Pacientes filtrados finais:', result.length);
      console.log('📝 Pacientes:', result.map(p => ({ name: p.name, cpf: p.cpf })));
      
      setFilteredPacients(result);
    };
    
    filterPacients();
  }, [pacients, filterDependent, sortField, sortDirection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // Se a patente "Dependente" for selecionada, marcar automaticamente como dependente
    const updatedValues: any = { [name]: newValue };
    if (name === 'rank' && value === 'Dependente') {
      updatedValues.isDependent = true;
    } else if (name === 'rank' && value !== 'Dependente') {
      updatedValues.isDependent = false;
    }
    
    if (editingPacient) {
      setEditingPacient(prev => prev ? { ...prev, ...updatedValues } : null);
    } else {
      setNewPacient(prev => ({ ...prev, ...updatedValues }));
    }
  };

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    
    if (editingPacient) {
      setEditingPacient(prev => prev ? { ...prev, cpf: value } : null);
    } else {
      setNewPacient(prev => ({ ...prev, cpf: value }));
    }
  };

  const validateForm = (data: typeof newPacient) => {
    if (!data.name.trim()) {
      throw new Error('Nome é obrigatório');
    }
    if (!data.cpf || data.cpf.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos');
    }
    if (!data.precCp.trim()) {
      throw new Error('Prec CP é obrigatório');
    }
    if (!data.rank.trim() || !MILITARY_RANKS.includes(data.rank as any)) {
      throw new Error('Posto/Graduação deve ser selecionado da lista');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = editingPacient || newPacient;
    
    try {
      validateForm(data);
      setIsSubmitting(true);
      setError(null);
      
      const url = editingPacient 
        ? `/api/admin/pacients/${editingPacient.cpf}`
        : '/api/admin/pacients';
      
      const method = editingPacient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPacient ? {
          precCp: editingPacient.precCp,
          name: editingPacient.name,
          rank: editingPacient.rank,
          isDependent: editingPacient.isDependent,
        } : data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar paciente');
      }

      // Limpar o formulário e fechar modal
      setNewPacient({
        cpf: '',
        precCp: '',
        name: '',
        rank: 'Dependente',
        isDependent: true,
      });
      setEditingPacient(null);
      setShowModal(false);
      
      await Swal.fire({
        title: 'Sucesso!',
        text: editingPacient ? 'Paciente atualizado com sucesso!' : 'Paciente criado com sucesso!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      // Atualizar a lista de pacientes
      fetchPacients();
      
    } catch (err: any) {
      setError(err.message);
      await Swal.fire({
        title: 'Erro!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pacient: Pacient) => {
    setEditingPacient(pacient);
    setShowModal(true);
  };

  const handleDelete = async (cpf: string, name: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja realmente excluir o paciente "${name}"? Esta ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/pacients/${cpf}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao excluir paciente');
        }

        await Swal.fire({
          title: 'Excluído!',
          text: 'Paciente excluído com sucesso.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        fetchPacients();
      } catch (err: any) {
        await Swal.fire({
          title: 'Erro!',
          text: err.message,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNewPacient = () => {
    setEditingPacient(null);
    setNewPacient({
      cpf: '',
      precCp: '',
      name: '',
      rank: 'Dependente',
      isDependent: true,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPacient(null);
    setError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetar para primeira página ao buscar
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pacientes</h1>
          <p className="mt-2 text-gray-600">
            Cadastre e gerencie os pacientes do sistema
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nome, CPF, Prec CP ou Posto/Graduação..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filterDependent}
                onChange={(e) => setFilterDependent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="false">Titular</option>
                <option value="true">Dependente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itens por página
              </label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleNewPacient}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                Novo Paciente
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Pacientes */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nome</span>
                      {sortField === 'name' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('cpf')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>CPF</span>
                      {sortField === 'cpf' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prec CP
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Posto/Graduação</span>
                      {sortField === 'rank' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('requests')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Solicitações</span>
                      {sortField === 'requests' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPacients.map((pacient) => (
                  <tr key={pacient.cpf} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pacient.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCPF(pacient.cpf)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pacient.precCp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pacient.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pacient.isDependent 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {pacient.isDependent ? 'Dependente' : 'Titular'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pacient._count.requests}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(pacient)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(pacient.cpf, pacient.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, pagination.total)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(page => {
                        // Mostrar sempre as primeiras 2, últimas 2, atual e adjacentes
                        return page <= 2 || 
                               page >= pagination.pages - 1 || 
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => {
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        
                        return (
                          <div key={page} className="flex">
                            {showEllipsis && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal para Novo/Editar Paciente */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPacient ? 'Editar Paciente' : 'Novo Paciente'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editingPacient ? editingPacient.name : newPacient.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={editingPacient ? formatCPF(editingPacient.cpf) : formatCPF(newPacient.cpf)}
                      onChange={handleCPFChange}
                      disabled={!!editingPacient}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prec CP *
                    </label>
                    <input
                      type="text"
                      name="precCp"
                      value={editingPacient ? editingPacient.precCp : newPacient.precCp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posto/Graduação *
                    </label>
                    <select
                      name="rank"
                      value={editingPacient ? editingPacient.rank : newPacient.rank}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {MILITARY_RANKS.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                  </div>



                  {error && (
                    <div className="text-red-600 text-sm mt-2">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Salvando...' : (editingPacient ? 'Atualizar' : 'Criar')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PacientsPage;
