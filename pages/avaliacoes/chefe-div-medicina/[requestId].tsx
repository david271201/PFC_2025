import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SpinLoading from '@/components/common/loading/SpinLoading';
import { auth } from '../../../auth';
import { GetServerSidePropsContext } from 'next';
import { checkPermission, UserType } from '@/permissions/utils';
import Swal from 'sweetalert2';

export default function AvaliacaoFormularioMedico() {
  const router = useRouter();
  const { requestId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verificarFormulario() {
      if (!requestId) return;

      try {
        // Verificar o status da solicitação e se já existe um formulário
        const response = await fetch(`/api/avaliacoes/chefe-div-medicina?requestId=${requestId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao carregar solicitação');
        }

        const data = await response.json();
        
        if (data.status === 'EXISTENTE') {
          // Se o formulário já existe, mostrar mensagem e redirecionar
          Swal.fire({
            title: 'Formulário já preenchido',
            text: 'O formulário médico já foi preenchido para esta solicitação.',
            icon: 'info',
            customClass: {
              confirmButton:
                'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
            },
          }).then(() => {
            router.push(`/solicitacoes/${requestId}`);
          });
        } else {
          // Redirecionar para a tela de cadastro com o ID da solicitação
          router.push(`/equipamentos/cadastro?requestId=${requestId}`);
        }
      } catch (error) {
        console.error('Erro:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar solicitação');
        setLoading(false);
      }
    }

    verificarFormulario();
  }, [requestId, router]);

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-600 text-lg font-semibold">{error}</div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-verde text-white rounded hover:bg-verdeEscuro"
          >
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-64">
        <SpinLoading />
        <p className="mt-4 text-lg">Carregando formulário médico...</p>
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

  // Verificação de permissão - apenas Chefe da Divisão de Medicina
  if (role !== 'CHEFE_DIV_MEDICINA') {
    return {
      redirect: {
        destination: '/solicitacoes',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
