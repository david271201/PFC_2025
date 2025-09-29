import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { Role } from '@prisma/client';
import { UserType } from '../../src/permissions/utils';

// Patentes militares conforme especificação
const PATENTES_MILITARES = [
  'Marechal',
  'General-de-Exército',
  'General-de-Divisão',
  'General-de-Brigada',
  'Coronel',
  'Tenente-Coronel',
  'Major',
  'Capitão',
  'Primeiro Tenente',
  'Segundo Tenente'
] as const;

// Tipos
interface Paciente {
  cpf: string;
  precCp: string;
  name: string;
  rank: string;
  isDependent: boolean;
  _count: {
    requests: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PacientesResponse {
  pacients: Paciente[];
  pagination: PaginationInfo;
}

const PacientesPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o modal
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para busca e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    cpf: '',
    precCp: '',
    name: '',
    rank: 'Segundo Tenente'
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

    fetchPacientes();
  }, [status, session, router, currentPage, itemsPerPage, searchTerm]);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/admin/pacientes?${params}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar pacientes');
      }
      
      const data: PacientesResponse = await response.json();
      setPacientes(data.pacients);
      setPagination(data.pagination);
    } catch (err) {
      setError('Erro ao carregar pacientes. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, cpf: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      throw new Error('Nome é obrigatório');
    }
    if (!formData.cpf || formData.cpf.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos');
    }
    if (!formData.precCp.trim()) {
      throw new Error('Prec CP é obrigatório');
    }
    if (!formData.rank.trim()) {
      throw new Error('Patente é obrigatória');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      validateForm();

      const url = editingPaciente 
        ? `/api/admin/pacientes/${editingPaciente.cpf}`
        : '/api/admin/pacientes';
      
      const method = editingPaciente ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar paciente');
      }

      // Resetar formulário e fechar modal
      setFormData({
        cpf: '',
        precCp: '',
        name: '',
        rank: 'Segundo Tenente'
      });
      setEditingPaciente(null);
      setShowModal(false);
      
      // Recarregar lista
      fetchPacientes();
      
      alert(editingPaciente ? 'Paciente atualizado com sucesso!' : 'Paciente criado com sucesso!');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormData({
      cpf: paciente.cpf,
      precCp: paciente.precCp,
      name: paciente.name,
      rank: paciente.rank
    });
    setShowModal(true);
  };

  const handleDelete = async (cpf: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o paciente "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pacientes/${cpf}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir paciente');
      }

      alert('Paciente excluído com sucesso!');
      fetchPacientes();
      
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleNewPaciente = () => {
    setEditingPaciente(null);
    setFormData({
      cpf: '',
      precCp: '',
      name: '',
      rank: 'Segundo Tenente'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPaciente(null);
    setError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-verde"></div>
            <p className="mt-4">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Gerenciamento de Pacientes</h1>
        
        {/* Controles superiores */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar por nome, CPF, Prec CP ou patente..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Itens por página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Itens por página:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            {/* Botão novo paciente */}
            <button
              onClick={handleNewPaciente}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Novo Paciente
            </button>
          </div>
        </div>

        {/* Tabela de pacientes */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {pacientes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'Nenhum paciente encontrado com os critérios de busca.' : 'Nenhum paciente cadastrado.'}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prec CP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitações
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => (
                    <tr key={paciente.cpf} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paciente.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCPF(paciente.cpf)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paciente.precCp}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paciente.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paciente._count.requests}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(paciente)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(paciente.cpf, paciente.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={paciente._count.requests > 0}
                          title={paciente._count.requests > 0 ? 'Não é possível excluir paciente com solicitações' : ''}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginação */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                      {Math.min(currentPage * itemsPerPage, pagination.total)} de{' '}
                      {pagination.total} pacientes
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border border-gray-300 rounded text-sm ${
                            currentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingPaciente ? 'Editar Paciente' : 'Novo Paciente'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    value={formatCPF(formData.cpf)}
                    onChange={handleCPFChange}
                    disabled={!!editingPaciente}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                    value={formData.precCp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patente *
                  </label>
                  <select
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {PATENTES_MILITARES.map((patente) => (
                      <option key={patente} value={patente}>
                        {patente}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : (editingPaciente ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

export default PacientesPage;
