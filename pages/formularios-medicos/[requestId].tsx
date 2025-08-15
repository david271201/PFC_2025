import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/card';
import SpinLoading from '@/components/common/loading/SpinLoading';
import { auth } from '../../auth';
import { GetServerSidePropsContext } from 'next';
import { checkPermission, UserType } from '@/permissions/utils';
import Swal from 'sweetalert2';

// Tipo para a estrutura do formulário médico
type FormularioMedico = {
  id: string;
  nomeBeneficiario: string;
  precCpMatriculaCpf: string;
  idade: string;
  postoGraduacaoTitular: string;
  necessitaAcompanhante: boolean;
  consultaExame: string;
  profissionalCiente: boolean;
  justificativaProfissionalCiente?: string;
  materialDisponivel: boolean;
  justificativaMaterialDisponivel?: string;
  pacienteNoMapa: boolean;
  justificativaPacienteNoMapa?: string;
  setorEmCondicoes: boolean;
  justificativaSetorEmCondicoes?: string;
  leitoReservado?: boolean;
  justificativaLeitoReservado?: string;
  hotelReservado?: boolean;
  justificativaHotelReservado?: string;
  motorista1?: string;
  horario1?: string;
  motorista2?: string;
  horario2?: string;
  motorista3?: string;
  horario3?: string;
  motorista4?: string;
  horario4?: string;
  aprovacao?: boolean;
  createdAt: string;
};

export default function VisualizarFormulariosMedicos() {
  const router = useRouter();
  const { requestId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formularios, setFormularios] = useState<FormularioMedico[]>([]);

  useEffect(() => {
    async function carregarFormularios() {
      if (!requestId) return;

      try {
        const response = await fetch(`/api/formularios-medicos/${requestId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao carregar formulários');
        }

        const data = await response.json();
        setFormularios(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar formulários');
        setLoading(false);
      }
    }

    carregarFormularios();
  }, [requestId]);

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <SpinLoading />
          <p className="mt-4 text-lg">Carregando formulários médicos...</p>
        </div>
      </Layout>
    );
  }

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

  if (formularios.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-lg font-semibold">Nenhum formulário médico encontrado para esta solicitação.</div>
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
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-grafite">Formulários Médicos da Solicitação</h1>
        
        {formularios.map((formulario, index) => {
          const isParte2 = formulario.consultaExame.includes('RM_DESTINO') || 
                           formulario.consultaExame.includes('Parte 2');
          
          return (
            <Card key={formulario.id} className="mb-6">
              <h2 className="text-xl font-semibold text-grafite mb-4">
                {isParte2 ? 'Formulário RM Destino (Parte 2)' : 'Formulário OMS Destino (Parte 1)'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Preenchido em: {formatarData(formulario.createdAt)}
              </p>
              
              {!isParte2 ? (
                // Conteúdo da Parte 1
                <>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Dados do Beneficiário</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nome completo:</p>
                        <p>{formulario.nomeBeneficiario}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Prec-CP/matrícula/CPF:</p>
                        <p>{formulario.precCpMatriculaCpf}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Idade:</p>
                        <p>{formulario.idade}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Posto/graduação do titular:</p>
                        <p>{formulario.postoGraduacaoTitular}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Necessita de acompanhante:</p>
                        <p>{formulario.necessitaAcompanhante ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-500">Consulta/exame/procedimento solicitado:</p>
                      <p>{formulario.consultaExame}</p>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Divisão de Medicina/Divisão de Clínicas</h3>
                    <div>
                      <p className="text-sm font-medium text-gray-500">O profissional está ciente da data do agendamento?</p>
                      <p>{formulario.profissionalCiente ? 'Sim' : 'Não'}</p>
                    </div>
                    {!formulario.profissionalCiente && formulario.justificativaProfissionalCiente && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Justificativa:</p>
                        <p>{formulario.justificativaProfissionalCiente}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Depósito de Material Cirúrgico/Farmácia/ Setor OPME</h3>
                    <div>
                      <p className="text-sm font-medium text-gray-500">O material para a cirurgia e os OPME encontram-se disponíveis?</p>
                      <p>{formulario.materialDisponivel ? 'Sim' : 'Não'}</p>
                    </div>
                    {!formulario.materialDisponivel && formulario.justificativaMaterialDisponivel && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Justificativa:</p>
                        <p>{formulario.justificativaMaterialDisponivel}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Centro Cirúrgico</h3>
                    <div>
                      <p className="text-sm font-medium text-gray-500">O nome do paciente consta no mapa cirúrgico?</p>
                      <p>{formulario.pacienteNoMapa ? 'Sim' : 'Não'}</p>
                    </div>
                    {!formulario.pacienteNoMapa && formulario.justificativaPacienteNoMapa && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Justificativa:</p>
                        <p>{formulario.justificativaPacienteNoMapa}</p>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-500">O setor está em condições de realizar o procedimento?</p>
                      <p>{formulario.setorEmCondicoes ? 'Sim' : 'Não'}</p>
                    </div>
                    {!formulario.setorEmCondicoes && formulario.justificativaSetorEmCondicoes && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Justificativa:</p>
                        <p>{formulario.justificativaSetorEmCondicoes}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Unidade de Internação</h3>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Há leito reservado para o paciente?</p>
                      <p>{formulario.leitoReservado ? 'Sim' : 'Não'}</p>
                    </div>
                    {formulario.leitoReservado === false && formulario.justificativaLeitoReservado && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Justificativa:</p>
                        <p>{formulario.justificativaLeitoReservado}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Conteúdo da Parte 2
                <>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Assistência Social</h3>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Há Hotel de Trânsito ou Casa de Hóspedes reservado(a) para o paciente?</p>
                      <p>{formulario.hotelReservado ? 'Sim' : 'Não'}</p>
                    </div>
                    {!formulario.hotelReservado && formulario.justificativaHotelReservado && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Justificativa:</p>
                        <p>{formulario.justificativaHotelReservado}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="font-semibold mb-2">Traslado</h3>
                    
                    {formulario.motorista1 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold">Deslocamento aeroporto/rodoviária/porto – HT/CH ou OMS/OCS/PSA</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Motorista:</p>
                            <p>{formulario.motorista1}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Horário:</p>
                            <p>{formulario.horario1}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formulario.motorista2 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold">Deslocamento HT/CH ou OMS/OCS/PSA no dia do procedimento/consulta</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Motorista:</p>
                            <p>{formulario.motorista2}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Horário:</p>
                            <p>{formulario.horario2}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formulario.motorista3 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold">Deslocamento OMS/OCS/PSA – HT/CH</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Motorista:</p>
                            <p>{formulario.motorista3}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Horário:</p>
                            <p>{formulario.horario3}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formulario.motorista4 && (
                      <div>
                        <p className="text-sm font-semibold">Deslocamento HT/CH - aeroporto/rodoviária/porto</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Motorista:</p>
                            <p>{formulario.motorista4}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Horário:</p>
                            <p>{formulario.horario4}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Aprovação</h3>
                    <p className="text-sm font-medium text-gray-500">Aprovação do check-list:</p>
                    <p>{formulario.aprovacao ? 'Aprovado' : 'Não aprovado'}</p>
                  </div>
                </>
              )}
            </Card>
          );
        })}

        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-cinzaClaro text-grafite rounded hover:bg-gray-300"
          >
            Voltar
          </button>
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

  return {
    props: {},
  };
}
