import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { Role } from '@prisma/client';
import { UserType } from '../../src/permissions/utils';

const PacientsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

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

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Pacientes</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-center text-gray-600">
            Sistema de pacientes em desenvolvimento...
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Em breve você poderá gerenciar pacientes aqui.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PacientsPage;
