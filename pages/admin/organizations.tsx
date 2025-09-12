import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { Role } from '@prisma/client';
import { UserType } from '../../src/permissions/utils';

// Tipos
interface Region {
  id: string;
  name: string;
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
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    regionId: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (err) {
      setError('Erro ao carregar organizações. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

      // Limpar o formulário e atualizar a lista
      setNewOrganization({
        name: '',
        regionId: regions.length > 0 ? regions[0].id : '',
      });
      
      setSuccessMessage('Organização criada com sucesso!');
      
      // Atualizar a lista de organizações
      fetchOrganizations();
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
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
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Região
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuários
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitações
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma organização encontrada.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
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
        </div>
      </div>
  );
};

export default OrganizationsPage;
