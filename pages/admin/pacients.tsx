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
  '1º Tenente', 
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

const PacientsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pacients, setPacients] = useState<Pacient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPacient, setNewPacient] = useState({
    cpf: '',
    precCp: '',
    name: '',
    rank: 'Dependente',
    isDependent: true,
  });
  const [editingPacient, setEditingPacient] = useState<Pacient | null>(null);

  // Verificação de autenticação
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/');
      return;
    }

    const user = session.user as UserType;
    if (user.role !== Role.SUBDIRETOR_SAUDE) {
      router.push('/solicitacoes');
      return;
    }
  }, [session, status, router]);

  // Carregar pacientes
  const fetchPacients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pacients');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar pacientes');
      }
      
      const data = await response.json();
      setPacients(data.pacients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPacients();
    }
  }, [session]);

  // Filtrar pacientes
  const filteredPacients = pacients.filter(pacient =>
    pacient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pacient.cpf.includes(searchTerm) ||
    pacient.precCp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pacient.rank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatação de CPF
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updatedValues: any = { [name]: value };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);

      const pacientData = editingPacient || newPacient;
      
      // Validações
      if (!pacientData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!pacientData.cpf || pacientData.cpf.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }
      if (!pacientData.precCp.trim()) {
        throw new Error('Prec CP é obrigatório');
      }

      const url = editingPacient 
        ? `/api/admin/pacients/${editingPacient.cpf}`
        : '/api/admin/pacients';
      
      const method = editingPacient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pacientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar paciente');
      }

      // Limpar formulário e fechar modal
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
      
      // Atualizar lista
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
      title: 'Confirmar exclusão',
      text: `Deseja realmente excluir o paciente ${name}?`,
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
          title: 'Sucesso!',
          text: 'Paciente excluído com sucesso!',
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

  if (status === 'loading') {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as UserType;
  if (user.role !== Role.SUBDIRETOR_SAUDE) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pacientes...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Pacientes</h1>
        
        {/* Alertas */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span className="font-bold">Erro:</span> {error}
          </div>
        )}

        {/* Seção de Busca */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome, CPF, Prec CP ou posto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleNewPacient}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Novo Paciente
            </button>
          </div>
        </div>

        {/* Tabela de Pacientes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Posto/Graduação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
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
              {filteredPacients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado.'}
                  </td>
                </tr>
              ) : (
                filteredPacients.map((pacient) => (
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
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(pacient.cpf, pacient.name)}
                        disabled={pacient._count.requests > 0}
                        className={`text-red-600 hover:text-red-900 ${
                          pacient._count.requests > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title={
                          pacient._count.requests > 0
                            ? 'Não é possível excluir pacientes com solicitações associadas'
                            : 'Excluir paciente'
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
        </div>

        {/* Modal */}
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
                      onClick={() => {
                        setShowModal(false);
                        setEditingPacient(null);
                        setError(null);
                      }}
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
