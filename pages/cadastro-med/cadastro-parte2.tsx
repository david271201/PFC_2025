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
  hotelReservado: z.string().transform((val) => val === "sim"),
  justificativaHotelReservado: z.string().optional(),
  
  // Campos de Traslado
  motorista1: z.string().optional(),
  // Validação do formato de horário (HH:MM)
  horario1: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
  }, { message: "Formato de horário inválido. Use o formato HH:MM" }),
  motorista2: z.string().optional(),
  horario2: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
  }, { message: "Formato de horário inválido. Use o formato HH:MM" }),
  motorista3: z.string().optional(),
  horario3: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
  }, { message: "Formato de horário inválido. Use o formato HH:MM" }),
  motorista4: z.string().optional(),
  horario4: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
  }, { message: "Formato de horário inválido. Use o formato HH:MM" }),
  
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
  const [isLoading, setIsLoading] = useState(false);
  const { requestId, formularioId } = router.query; // Captura o ID da solicitação e do formulário da URL

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormularioMedicoParte2Data>({
    resolver: zodResolver(formularioMedicoParte2Schema),
    defaultValues: {
      hotelReservado: false,
      aprovacao: false,
    }
  });

  // Buscar dados da solicitação para preencher informações contextuais
  useEffect(() => {
    console.log('=== Página de cadastro médico - Parte 2 ===');
    console.log('URL atual:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    console.log('URL search params:', typeof window !== 'undefined' ? window.location.search : 'N/A');
    console.log('Router query params completos:', router.query);
    console.log('Request ID recebido do router:', requestId);
    console.log('Tipo do requestId:', typeof requestId);
    
    // Tentar obter o ID diretamente da URL também
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const requestIdFromUrl = urlParams.get('requestId');
    console.log('Request ID obtido diretamente da URL:', requestIdFromUrl);
    
    const fetchRequestData = async () => {
      if (!requestId && !requestIdFromUrl) {
        console.error('ID da solicitação não encontrado');
        Swal.fire({
          title: 'Erro',
          text: 'ID da solicitação não encontrado',
          icon: 'error',
          customClass: {
            confirmButton:
              'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
          },
        }).then(() => {
          router.push('/solicitacoes');
        });
        return;
      }
      
      setIsLoading(true);
      
      // Garantir que estamos usando o ID correto, com preferência para o da URL direta
      const actualRequestId = requestIdFromUrl || (Array.isArray(requestId) ? requestId[0] : requestId);
      console.log('ID de solicitação que será usado:', actualRequestId);
      
      try {
        // Verificar se já existe um formulário preenchido para esta solicitação
        const formularioResponse = await fetch(`/api/formularios-medicos/${actualRequestId}?parte=RM_DESTINO`);
        
        if (formularioResponse.ok) {
          const formularioData = await formularioResponse.json();
          
          if (formularioData) {
            console.log('Formulário já preenchido:', formularioData);
            // Preencher o formulário com dados existentes
            reset({
              hotelReservado: formularioData.hotelReservado,
              justificativaHotelReservado: formularioData.justificativaHotelReservado,
              motorista1: formularioData.motorista1 || '',
              horario1: formularioData.horario1 || '',
              motorista2: formularioData.motorista2 || '',
              horario2: formularioData.horario2 || '',
              motorista3: formularioData.motorista3 || '',
              horario3: formularioData.horario3 || '',
              motorista4: formularioData.motorista4 || '',
              horario4: formularioData.horario4 || '',
              observacoes: formularioData.observacoes || '',
              aprovacao: formularioData.aprovacao || false
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debug da condição
    console.log('Condição para buscar dados:', { requestId, formularioId, shouldFetch: requestId && typeof requestId === 'string' });
    
    // Buscar dados sempre que tivermos um ID de solicitação válido
    if (requestId && typeof requestId === 'string') {
      fetchRequestData();
    }
  }, [requestId, reset, router]);

  // Buscar dados do formulário quando houver um formularioId
  useEffect(() => {
    const fetchFormulario = async () => {
      if (!formularioId) return;
      
      setIsLoading(true);
      
      try {
        // Buscar dados do formulário específico
        const response = await fetch(`/api/formularios-medicos/formulario/${formularioId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do formulário');
        }
        
        const data = await response.json();
        
        // Preencher o formulário com os dados obtidos
        reset({
          hotelReservado: data.hotelReservado,
          justificativaHotelReservado: data.justificativaHotelReservado,
          motorista1: data.motorista1 || '',
          horario1: data.horario1 || '',
          motorista2: data.motorista2 || '',
          horario2: data.horario2 || '',
          motorista3: data.motorista3 || '',
          horario3: data.horario3 || '',
          motorista4: data.motorista4 || '',
          horario4: data.horario4 || '',
          observacoes: data.observacoes || '',
          aprovacao: data.aprovacao || false
        });
      } catch (error) {
        console.error('Erro ao buscar formulário:', error);
        Swal.fire({
          title: 'Erro',
          text: error instanceof Error ? error.message : 'Erro ao buscar formulário',
          icon: 'error',
          customClass: {
            confirmButton:
              'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
          },
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (formularioId && typeof formularioId === 'string') {
      fetchFormulario();
    }
  }, [formularioId, reset, router]);

  const handleRadioChange = (fieldName: keyof FormularioMedicoParte2Data, value: string) => {
    setValue(fieldName, value === "sim");
  };

  const onSubmit = async (data: FormularioMedicoParte2Data) => {
    setIsSubmitting(true);
    console.log('Dados do formulário a serem enviados:', data);
    
    try {
      if (!requestId) {
        throw new Error('ID da solicitação não fornecido');
      }
      
      // Verificar se estamos editando um formulário existente ou criando um novo
      const isEditing = formularioId !== undefined && formularioId !== null;
      console.log('Modo de edição:', isEditing ? 'Editando formulário existente' : 'Criando novo formulário');
      
      // Buscar dados do paciente para preenchimento adequado
      let pacientData = {
        nomeBeneficiario: "Formulário Parte 2 - RM Destino",
        precCpMatriculaCpf: "N/A",
        idade: "N/A",
        postoGraduacaoTitular: "N/A",
        necessitaAcompanhante: false,
        consultaExame: "N/A"
      };
      
      // Tentar buscar dados reais do paciente da solicitação
      try {
        const requestResponse = await fetch(`/api/requests/${requestId}/index`);
        if (requestResponse.ok) {
          const requestData = await requestResponse.json();
          if (requestData.pacient) {
            pacientData = {
              nomeBeneficiario: requestData.pacient.name,
              precCpMatriculaCpf: requestData.pacient.precCp || requestData.pacient.cpf,
              idade: requestData.pacient.age || "N/A",
              postoGraduacaoTitular: requestData.pacient.rank,
              necessitaAcompanhante: requestData.needsCompanion || false,
              consultaExame: requestData.description || "N/A",
            };
            console.log('Dados do paciente obtidos:', pacientData);
          }
        }
      } catch (error) {
        console.warn('Não foi possível obter dados do paciente:', error);
      }
      
      // Enviar para a API de cadastro com o ID da solicitação
      const formularioResponse = await fetch('/api/formularios-medicos/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // ID para atualização, se existir
          id: isEditing ? formularioId : undefined,
          
          // Dados do beneficiário (obrigatórios na estrutura)
          ...pacientData,
          
          // Campos da parte 2
          justificativaHotelReservado: data.justificativaHotelReservado, // Campo já alinhado com a API
          hotelReservado: data.hotelReservado,
          motorista1: data.motorista1,
          horario1: data.horario1,
          motorista2: data.motorista2,
          horario2: data.horario2,
          motorista3: data.motorista3,
          horario3: data.horario3,
          motorista4: data.motorista4,
          horario4: data.horario4,
          observacoes: data.observacoes,
          aprovacao: data.aprovacao,
          
          // ID da solicitação e parte do formulário
          requestId: Array.isArray(requestId) ? requestId[0] : requestId as string,
          parte: 'RM_DESTINO'
        }),
      });

      if (!formularioResponse.ok) {
        const error = await formularioResponse.json();
        console.error('Erro na resposta da API de cadastro:', error);
        throw new Error(error.message || 'Erro ao enviar formulário médico');
      }
      
      const formularioData = await formularioResponse.json();
      console.log('Formulário salvo com sucesso:', formularioData);
      
      // Atualizar o fluxo da solicitação através da API de avaliação
      // Este endpoint irá atualizar o status da solicitação para o próximo passo do fluxo
      const avaliacaoResponse = await fetch('/api/avaliacoes/chefe-secao-regional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: Array.isArray(requestId) ? requestId[0] : requestId as string,
          formularioId: formularioData.id,
          aprovado: data.aprovacao
        }),
      });
      
      if (!avaliacaoResponse.ok) {
        const error = await avaliacaoResponse.json();
        console.error('Erro na resposta da API de avaliação:', error);
        throw new Error(error.message || 'Erro ao atualizar status da solicitação');
      }
      
      const avaliacaoData = await avaliacaoResponse.json();
      console.log('Avaliação processada com sucesso:', avaliacaoData);

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
      console.error('Erro ao processar formulário:', error);
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

  return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-grafite">Formulário de Atendimento Médico - RM Destino (Seç Sau Reg)</h1>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <SpinLoading />
            <p className="ml-2 text-grafite">Carregando dados do formulário...</p>
          </div>
        ) : (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-7 gap-4">
            <div className="col-span-7 mb-4">
              <h2 className="text-lg font-semibold text-grafite">ASSISTÊNCIA SOCIAL</h2>
              {/* <p className="text-sm text-red-600 mb-2">(Daqui pra baixo, a cargo da RM destino (Seç Sau Reg, mudando o nome))</p> */}
              <div className="mt-2">
                <p className="mb-1 text-sm font-medium text-grafite">Há Hotel de Trânsito ou Casa de Hóspedes reservado(a) para o paciente?</p>
                <div className="flex items-center gap-6 mb-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      value="sim"
                      onChange={() => handleRadioChange('hotelReservado', 'sim')}
                      checked={Boolean(watch('hotelReservado'))}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      value="nao"
                      onChange={() => handleRadioChange('hotelReservado', 'nao')}
                      checked={!Boolean(watch('hotelReservado'))}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Não</span>
                  </label>
                </div>
                <div className="col-span-7">
                  <label className="mb-1 block text-sm font-medium text-grafite">
                    Em caso de negativa justificar:
                  </label>
                  <textarea
                    className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                    rows={2}
                    {...register('justificativaHotelReservado')}
                  />
                </div>
                <div className="mt-2 text-right">
                  {/* <p className="text-sm italic">Assinatura: _______________________</p> */}
                  <p className="text-sm">Chefe do Setor de Assistência Social</p>
                </div>
              </div>
            </div>
            
            <div className="col-span-7 border-t border-gray-200 pt-4 mt-4">
              <p className="text-base font-bold text-grafite mb-2">Folha nº 2</p>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-grafite bg-gray-200 p-2 mb-4">TRASLADO:</h2>
                
                {/* Deslocamento aeroporto/rodoviária/porto – HT/CH ou OMS/OCS/PSA */}
                <div className="mb-4 border border-gray-300 p-3 rounded-md bg-gray-50">
                  <p className="font-semibold mb-2">Deslocamento aeroporto/rodoviária/porto – HT/CH ou OMS/OCS/PSA</p>
                  <p className="text-sm italic mb-2">(é necessário verificar se o paciente chegará direto para a internação ou não)</p>
                  
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista1')}
                      />
                    </div>
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário: (formato HH:MM)
                      </label>
                      <input
                        type="time"
                        className={`w-full rounded-md border ${errors.horario1 ? 'border-red-500' : 'border-cinzaClaro'} px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none`}
                        {...register('horario1')}
                        placeholder="HH:MM"
                      />
                      {errors.horario1 && (
                        <p className="text-red-500 text-xs mt-1">{errors.horario1.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Deslocamento HT/CH ou OMS/OCS/PSA no dia do procedimento/consulta */}
                <div className="mb-4 border border-gray-300 p-3 rounded-md bg-gray-50">
                  <p className="font-semibold mb-2">Deslocamento HT/CH ou OMS/OCS/PSA no dia do procedimento/consulta</p>
                  
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista2')}
                      />
                    </div>
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário: (formato HH:MM)
                      </label>
                      <input
                        type="time"
                        className={`w-full rounded-md border ${errors.horario2 ? 'border-red-500' : 'border-cinzaClaro'} px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none`}
                        {...register('horario2')}
                        placeholder="HH:MM"
                      />
                      {errors.horario2 && (
                        <p className="text-red-500 text-xs mt-1">{errors.horario2.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Deslocamento OMS/OCS/PSA – HT/CH */}
                <div className="mb-4 border border-gray-300 p-3 rounded-md bg-gray-50">
                  <p className="font-semibold mb-2">Deslocamento OMS/OCS/PSA – HT/CH</p>
                  
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista3')}
                      />
                    </div>
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário: (formato HH:MM)
                      </label>
                      <input
                        type="time"
                        className={`w-full rounded-md border ${errors.horario3 ? 'border-red-500' : 'border-cinzaClaro'} px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none`}
                        {...register('horario3')}
                        placeholder="HH:MM"
                      />
                      {errors.horario3 && (
                        <p className="text-red-500 text-xs mt-1">{errors.horario3.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Deslocamento HT/CH - aeroporto/rodoviária/porto */}
                <div className="mb-4 border border-gray-300 p-3 rounded-md bg-gray-50">
                  <p className="font-semibold mb-2">Deslocamento HT/CH - aeroporto/rodoviária/porto</p>
                  
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Motorista:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('motorista4')}
                      />
                    </div>
                    <div className="w-full md:w-[48%]">
                      <label className="mb-1 block text-sm font-medium text-grafite">
                        Horário: (formato HH:MM)
                      </label>
                      <input
                        type="time"
                        className={`w-full rounded-md border ${errors.horario4 ? 'border-red-500' : 'border-cinzaClaro'} px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none`}
                        {...register('horario4')}
                        placeholder="HH:MM"
                      />
                      {errors.horario4 && (
                        <p className="text-red-500 text-xs mt-1">{errors.horario4.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 mb-3 text-right">
                  {/* <p className="text-sm italic">Assinatura: _______________________</p> */}
                  <p className="text-sm">Ch Setor de Assistência Social</p>
                </div>
              </div>
              
              {/* Observações */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Observações:</h3>
                <ol className="list-decimal ml-5 mb-4">
                  <li className="mb-2">Caso haja necessidade de deslocamentos adicionais, o serviço social organizará o cronograma, conforme a escala dos motoristas da UAL de destino.</li>
                </ol>
                
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-grafite">
                    Observações adicionais:
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                    {...register('observacoes')}
                    placeholder="Insira observações adicionais aqui, se necessário"
                  ></textarea>
                </div>
              </div>
              
              {/* Aprovação do checklist */}
              <div className="mb-6 border-t border-gray-200 pt-4">
                <p className="mb-2">2) O presente check-list deverá ser enviado à RM e à UG FuSEx de origem do paciente 8 (oito) dias antes do deslocamento do beneficiário e seu acompanhante.</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="aprovacao"
                    {...register('aprovacao')}
                    className="h-4 w-4 text-verde focus:ring-verde"
                  />
                  <label htmlFor="aprovacao" className="text-sm font-medium text-grafite">
                    Aprovo as informações do Check list
                  </label>
                </div>
                
                <div className="mt-3 mb-3 text-center">
                  {/* <p className="text-sm italic">Assinatura: _______________________</p> */}
                  <p className="text-sm">Cmt/Dir/Ch da UG FuSEx</p>
                </div>
              </div>
            </div>
            
            <div className="col-span-7 mt-8 flex justify-between">
              <Button
                type="button"
                className="bg-cinzaClaro text-grafite hover:bg-gray-300 px-8 py-2"
                onClick={() => router.back()}
              >
                Voltar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-verde text-white hover:bg-verdeEscuro px-8 py-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <SpinLoading />
                    <span className="ml-2">Salvando...</span>
                  </div>
                ) : (
                  'Salvar e Enviar'
                )}
              </Button>
            </div>
          </form>
        </Card>
        )}
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
