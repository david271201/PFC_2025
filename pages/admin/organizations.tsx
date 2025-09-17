import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { Role } from '@prisma/client';
import { UserType } from '../../src/permissions/utils';
import DefaultUsersModal from '@/components/admin/DefaultUsersModal';

// Tipos
interface Region {
  id: string;
  name: string;
}

// Tipos para as senhas dos usuários padrão
interface UserPasswordInfo {
  name: string;
  role: Role;
  email: string;
  password: string;
}

interface Organization {
  id: string;
  name: string;
  region: Region;
  regionId: string;
  _count: {
    users: number;
    sentRequests: number;
  }
}

const OrganizationsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    regionId: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para o modal de usuários padrão
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userPasswords, setUserPasswords] = useState<UserPasswordInfo[]>([]);
  const [newOrgName, setNewOrgName] = useState('');
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

    fetchOrganizations();
    fetchRegions();
  }, [status, session, router]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/organizations');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar organizações');
      }
      
      const data = await response.json();
      setOrganizations(data);
      setFilteredOrganizations(data);
    } catch (err) {
      setError('Erro ao carregar organizações. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para filtrar e ordenar as organizações
  useEffect(() => {
    const filterOrganizations = () => {
      let result = [...organizations];
      
      // Aplicar filtro de busca por nome
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(org => 
          org.name.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      // Aplicar filtro por região
      if (filterRegion) {
        result = result.filter(org => org.regionId === filterRegion);
      }
      
      // Aplicar ordenação
      result.sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortField === 'region') {
          return sortDirection === 'asc'
            ? a.region.name.localeCompare(b.region.name)
            : b.region.name.localeCompare(a.region.name);
        } else if (sortField === 'users') {
          return sortDirection === 'asc'
            ? a._count.users - b._count.users
            : b._count.users - a._count.users;
        } else if (sortField === 'requests') {
          return sortDirection === 'asc'
            ? a._count.sentRequests - b._count.sentRequests
            : b._count.sentRequests - a._count.sentRequests;
        }
        
        return 0;
      });
      
      setFilteredOrganizations(result);
      setCurrentPage(1); // Reset para primeira página quando filtrar
    };
    
    filterOrganizations();
  }, [organizations, searchTerm, filterRegion, sortField, sortDirection]);

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/admin/regions');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar regiões');
      }
      
      const data = await response.json();
      setRegions(data);

      // Se houver regiões, selecionar a primeira por padrão
      if (data.length > 0) {
        setNewOrganization(prev => ({ ...prev, regionId: data[0].id }));
      }
    } catch (err) {
      setError('Erro ao carregar regiões. Por favor, tente novamente.');
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewOrganization(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOrganization.name.trim()) {
      setError('Nome da organização é obrigatório');
      return;
    }

    if (!newOrganization.regionId) {
      setError('Região é obrigatória');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrganization),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar organização');
      }

      // Obter resposta com dados da organização e senhas dos usuários
      const result = await response.json();
      
      // Armazenar temporariamente as senhas dos usuários para exibir no modal
      if (result.plainPasswords && result.plainPasswords.length > 0) {
        setUserPasswords(result.plainPasswords);
        setNewOrgName(result.organization.name);
        setIsUserModalOpen(true);
      }

      // Limpar o formulário
      setNewOrganization({
        name: '',
        regionId: regions.length > 0 ? regions[0].id : '',
      });
      
      setSuccessMessage('Organização criada com sucesso!');
      
      // Atualizar a lista de organizações
      fetchOrganizations();
      
      // Limpar a mensagem de sucesso após 3 segundos (mas apenas se o modal não estiver aberto)
      if (!result.plainPasswords || result.plainPasswords.length === 0) {
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar organização');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a organização "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/organizations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir organização');
      }

      setSuccessMessage('Organização removida com sucesso!');
      
      // Atualizar a lista de organizações
      fetchOrganizations();
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir organização');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para paginação
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Volta para a primeira página
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Calcular organizações para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrganizations = filteredOrganizations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4">Carregando...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Organizações Militares</h1>
        
        {/* Modal de usuários padrão */}
        <DefaultUsersModal 
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setSuccessMessage(null);
          }}
          userPasswords={userPasswords}
          organizationName={newOrgName}
        />
        
        {/* Alertas */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span className="font-bold">Erro:</span> {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <span className="font-bold">Sucesso:</span> {successMessage}
          </div>
        )}

        {/* Seção de Busca e Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Buscar Organizações</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Campo de Busca por Nome */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Buscar por Nome
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite para buscar..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtro por Região */}
            <div>
              <label htmlFor="filterRegion" className="block text-sm font-medium mb-1">
                Filtrar por Região
              </label>
              <select
                id="filterRegion"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Regiões</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Itens por Página */}
            <div>
              <label htmlFor="itemsPerPage" className="block text-sm font-medium mb-1">
                Itens por página
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Estatísticas e resultados da busca */}
          <div className="text-sm text-gray-600">
            Mostrando {filteredOrganizations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredOrganizations.length)} de {filteredOrganizations.length} organizações
            {searchTerm && (
              <span> filtradas por "<strong>{searchTerm}</strong>"</span>
            )}
            {filterRegion && (
              <span> na região <strong>{regions.find(r => r.id === filterRegion)?.name}</strong></span>
            )}
          </div>
        </div>

        {/* Formulário para adicionar nova organização */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Adicionar Nova Organização</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nome da Organização
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newOrganization.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o nome da OM"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="regionId" className="block text-sm font-medium mb-1">
                  Região
                </label>
                <select
                  id="regionId"
                  name="regionId"
                  value={newOrganization.regionId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {regions.length === 0 ? (
                    <option value="">Carregando regiões...</option>
                  ) : (
                    regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Adicionando...' : 'Adicionar Organização'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de organizações */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center focus:outline-none"
                  >
                    Nome
                    {sortField === 'name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('region')}
                    className="flex items-center focus:outline-none"
                  >
                    Região
                    {sortField === 'region' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('users')}
                    className="flex items-center focus:outline-none"
                  >
                    Usuários
                    {sortField === 'users' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('requests')}
                    className="flex items-center focus:outline-none"
                  >
                    Solicitações
                    {sortField === 'requests' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma organização encontrada.
                  </td>
                </tr>
              ) : (
                currentOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {org.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.region?.name || 'Sem região'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org._count.users}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org._count.sentRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(org.id, org.name)}
                        disabled={org._count.users > 0 || org._count.sentRequests > 0}
                        className={`text-red-600 hover:text-red-900 ${
                          org._count.users > 0 || org._count.sentRequests > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title={
                          org._count.users > 0 || org._count.sentRequests > 0
                            ? 'Não é possível excluir organizações com usuários ou solicitações associados'
                            : 'Excluir organização'
                        }
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Paginação */}
          {filteredOrganizations.length > 0 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{filteredOrganizations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{" "}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOrganizations.length)}</span> de{" "}
                      <span className="font-medium">{filteredOrganizations.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Primeira</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Números das páginas */}
                      {renderPageNumbers().map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Próximo</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Última</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

export default OrganizationsPage;
