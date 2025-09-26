import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Swal from 'sweetalert2';

import Layout from '@/components/layout/Layout';
import Card from '@/components/common/card';
import Button from '@/components/common/button';
import Select from '@/components/common/select';
import SpinLoading from '@/components/common/loading/SpinLoading';
import { auth } from '../../auth';
import { GetServerSidePropsContext } from 'next';
import { checkPermission, UserType } from '@/permissions/utils';

// Schema para validação da segunda parte do formulário
const formularioMedicoParte2Schema = z.object({
  hotelReservado: z.string().optional().transform((val) => val === "sim" ? true : val === "nao" ? false : undefined),
  justificativaHotel: z.string().optional(),
  
  // Campos de Traslado
  motorista1: z.string().optional(),
  horario1: z.string().optional(),
  motorista2: z.string().optional(),
  horario2: z.string().optional(),
  motorista3: z.string().optional(),
  horario3: z.string().optional(),
  motorista4: z.string().optional(),
  horario4: z.string().optional(),
  
  // Observações
  observacoes: z.string().optional(),
  
  // Aprovação do checklist
  aprovacao: z.boolean().optional(),
});

type FormularioMedicoParte2Data = z.infer<typeof formularioMedicoParte2Schema>;

// Tipo para os dados da primeira parte
type FormularioMedicoParte1Data = {
  nomeBeneficiario: string;
  precCpMatriculaCpf: string;
  idade: string;
  postoGraduacaoTitular: string;
  necessitaAcompanhante: boolean;
  consultaExame: string;
};

export default function FormularioMedicoParte2() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pacientData, setPacientData] = useState<FormularioMedicoParte1Data | null>(null);
  const { requestId } = router.query; // Captura o ID da solicitação da URL

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormularioMedicoParte2Data>({
    resolver: zodResolver(formularioMedicoParte2Schema),
    defaultValues: {
      hotelReservado: false,
      aprovacao: false,
    }
  });

  // Função para buscar dados da solicitação e armazenar dados do paciente
  useEffect(() => {
    const fetchRequestData = async () => {
      if (!requestId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/requests/${requestId}/basic-info`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar dados da solicitação');
        }
        
        const requestData = await response.json();
        
        // Armazenar dados do paciente para usar no formulário
        if (requestData.pacient) {
          const pacientInfo: FormularioMedicoParte1Data = {
            nomeBeneficiario: requestData.pacient.name || '',
            precCpMatriculaCpf: requestData.pacient.cpf || '',
            postoGraduacaoTitular: requestData.pacient.rank || '',
            idade: '', // Por enquanto deixaremos em branco
            necessitaAcompanhante: requestData.needsCompanion || false,
            consultaExame: '',
          };

          // Se já existir um formulário registrado, buscar dados dele
          if (requestData.formulariosRegistrados && requestData.formulariosRegistrados.length > 0) {
            const ultimoFormulario = requestData.formulariosRegistrados[requestData.formulariosRegistrados.length - 1];
            pacientInfo.consultaExame = ultimoFormulario.consultaExame || '';
          }

          setPacientData(pacientInfo);
        }
        
        console.log('Dados da solicitação carregados para parte 2:', requestData);
        
      } catch (error) {
        console.error('Erro ao buscar dados da solicitação:', error);
        Swal.fire({
          title: 'Aviso',
          text: 'Não foi possível carregar os dados automaticamente. Você pode preencher o formulário manualmente.',
          icon: 'warning',
          customClass: {
            confirmButton:
              'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
          },
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequestData();
  }, [requestId]);

  const handleRadioChange = (fieldName: keyof FormularioMedicoParte2Data, value: string) => {
    setValue(fieldName, value);
  };

  const onSubmit = async (data: FormularioMedicoParte2Data) => {
    setIsSubmitting(true);
    
    try {
      if (!requestId) {
        throw new Error('ID da solicitação não fornecido');
      }
      
      // Enviar para a API de cadastro com o ID da solicitação
      const formularioResponse = await fetch('/api/formularios-medicos/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Dados do beneficiário (usar dados reais se disponíveis)
          nomeBeneficiario: pacientData?.nomeBeneficiario || "Formulário Parte 2 - RM Destino",
          precCpMatriculaCpf: pacientData?.precCpMatriculaCpf || "N/A",
          idade: pacientData?.idade || "N/A",
          postoGraduacaoTitular: pacientData?.postoGraduacaoTitular || "N/A",
          necessitaAcompanhante: pacientData?.necessitaAcompanhante || false,
          consultaExame: pacientData?.consultaExame || "N/A",
          
          // Campos da parte 2
          ...data,
          
          // ID da solicitação e parte do formulário
          requestId: requestId as string,
          parte: 'RM_DESTINO'
        }),
      });

      if (!formularioResponse.ok) {
        const error = await formularioResponse.json();
        throw new Error(error.message || 'Erro ao enviar formulário médico');
      }
      
      const formularioData = await formularioResponse.json();
      
      // Atualizar o fluxo da solicitação através da API de avaliação
      const avaliacaoResponse = await fetch('/api/avaliacoes/chefe-secao-regional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId,
          formularioId: formularioData.id
        }),
      });
      
      if (!avaliacaoResponse.ok) {
        const error = await avaliacaoResponse.json();
        throw new Error(error.message || 'Erro ao atualizar status da solicitação');
      }

      Swal.fire({
        title: 'Sucesso',
        text: 'Formulário médico enviado com sucesso e avaliação concluída',
        icon: 'success',
        customClass: {
          confirmButton:
            'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
        },
      }).then(() => {
        router.push('/solicitacoes');
      });
    } catch (error) {
      Swal.fire({
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao enviar formulário médico',
        icon: 'error',
        customClass: {
          confirmButton:
            'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar indicador de carregamento enquanto busca os dados
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col gap-4 p-4">
          <h1 className="text-2xl font-bold text-grafite">Formulário de Atendimento Médico - RM Destino (Seç Sau Reg)</h1>
          <Card>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-verde mx-auto mb-4"></div>
                <p className="text-grafite">Carregando dados do paciente...</p>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
      <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-grafite">Formulário de Atendimento Médico - RM Destino (Seç Sau Reg)</h1>
        
        {/* Card com dados do paciente */}
        {pacientData && (
          <Card>
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-grafite mb-3">Dados do Beneficiário</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Nome:</span>
                  <p className="text-grafite">{pacientData.nomeBeneficiario}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">CPF:</span>
                  <p className="text-grafite">{pacientData.precCpMatriculaCpf}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Posto/Graduação:</span>
                  <p className="text-grafite">{pacientData.postoGraduacaoTitular}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Acompanhante:</span>
                  <p className="text-grafite">{pacientData.necessitaAcompanhante ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-7 gap-4">
            <div className="col-span-7 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-grafite mb-4 border-b border-gray-300 pb-2">ASSISTÊNCIA SOCIAL</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="mb-3 text-sm font-medium text-grafite">Há Hotel de Trânsito ou Casa de Hóspedes reservado(a) para o paciente?</p>
                    <div className="flex items-center gap-6 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value="sim"
                          {...register('hotelReservado')}
                          onChange={(e) => handleRadioChange('hotelReservado', e.target.value)}
                          className="h-4 w-4 text-verde focus:ring-verde" 
                        />
                        <span>Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value="nao"
                          {...register('hotelReservado')}
                          onChange={(e) => handleRadioChange('hotelReservado', e.target.value)}
                          className="h-4 w-4 text-verde focus:ring-verde" 
                        />
                        <span>Não</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium text-grafite">
                      Em caso de negativa, justificar:
                    </label>
                    <textarea
                      className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                      rows={3}
                      placeholder="Descreva a justificativa caso tenha selecionado 'Não'"
                      {...register('justificativaHotel')}
                    />
                  </div>
                </div>
                <div className="mt-2 text-right">
                  {/* <p className="text-sm italic">Assinatura: _______________________</p> */}
                  <p className="text-sm">Chefe do Setor de Assistência Social</p>
                </div>
              </div>
            </div>
            
            <div className="col-span-7 border-t border-gray-200 pt-6 mt-6">
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white bg-verde p-3 rounded-t-lg mb-0">TRASLADO</h2>
                <div className="bg-gray-50 p-4 rounded-b-lg border border-gray-200 border-t-0">
                  <p className="text-xs text-gray-600 mb-4 italic">Folha nº 2 - Informações de deslocamento</p>
                
                {/* Deslocamento aeroporto/rodoviária/porto – HT/CH ou OMS/OCS/PSA */}
                <div className="mb-6 border border-gray-300 p-4 rounded-lg bg-white shadow-sm">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="bg-verde text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-semibold text-grafite">Deslocamento aeroporto/rodoviária/porto → HT/CH ou OMS/OCS/PSA</p>
                      <p className="text-xs text-gray-600 mt-1">(é necessário verificar se o paciente chegará direto para a internação ou não)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do motorista"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista1')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário:
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario1')}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Deslocamento HT/CH ou OMS/OCS/PSA no dia do procedimento/consulta */}
                <div className="mb-6 border border-gray-300 p-4 rounded-lg bg-white shadow-sm">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="bg-verde text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <p className="font-semibold text-grafite">Deslocamento HT/CH ou OMS/OCS/PSA no dia do procedimento/consulta</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do motorista"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista2')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário:
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario2')}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Deslocamento OMS/OCS/PSA – HT/CH */}
                <div className="mb-6 border border-gray-300 p-4 rounded-lg bg-white shadow-sm">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="bg-verde text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <p className="font-semibold text-grafite">Deslocamento OMS/OCS/PSA → HT/CH</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do motorista"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista3')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário:
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario3')}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Deslocamento HT/CH - aeroporto/rodoviária/porto */}
                <div className="mb-6 border border-gray-300 p-4 rounded-lg bg-white shadow-sm">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="bg-verde text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                    <p className="font-semibold text-grafite">Deslocamento HT/CH → aeroporto/rodoviária/porto</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do motorista"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista4')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário:
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario4')}
                      />
                    </div>
                  </div>
                </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200 text-right">
                    <p className="text-sm text-gray-600">Ch Setor de Assistência Social</p>
                  </div>
                </div>
              </div>
              
              {/* Observações */}
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  Observações Importantes:
                </h3>
                <ol className="list-decimal ml-5 space-y-2 text-sm text-yellow-700">
                  <li>Caso haja necessidade de deslocamentos adicionais, o serviço social organizará o cronograma, conforme a escala dos motoristas da UAL de destino.</li>
                  <li>O presente check-list deverá ser enviado à RM e à UG FuSEx de origem do paciente <strong>8 (oito) dias antes</strong> do deslocamento do beneficiário e seu acompanhante.</li>
                </ol>
              </div>
              
              {/* Aprovação do checklist */}
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">Aprovação Final</h3>
                
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="aprovacao"
                    {...register('aprovacao')}
                    className="h-5 w-5 text-verde focus:ring-verde mt-0.5"
                  />
                  <label htmlFor="aprovacao" className="text-sm font-medium text-green-800 cursor-pointer">
                    Confirmo que revisei e aprovo todas as informações do check-list acima
                  </label>
                </div>
                
                <div className="mt-4 pt-3 border-t border-green-200 text-center">
                  <p className="text-sm text-green-700 font-medium">Cmt/Dir/Ch da UG FuSEx</p>
                </div>
              </div>
            </div>
            
            <div className="col-span-7 mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  type="button"
                  className="w-full sm:w-auto bg-cinzaClaro text-grafite hover:bg-gray-300"
                  onClick={() => router.back()}
                >
                  ← Voltar
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    className="w-full sm:w-auto bg-cinzaClaro text-grafite hover:bg-gray-300"
                    onClick={() => router.push('/solicitacoes')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Formulário'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
      </div>
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

  // Verificação de permissão
  if (!checkPermission(role, 'requests:create')) {
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
