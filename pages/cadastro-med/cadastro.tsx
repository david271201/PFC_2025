import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Swal from 'sweetalert2';

import Layout from '@/components/layout/Layout';
import Card from '@/components/common/card';
import Input, { formatCurrency } from '@/components/common/input';
import Button from '@/components/common/button';
import { auth } from '../../auth';
import { GetServerSidePropsContext } from 'next';
import { checkPermission, UserType } from '@/permissions/utils';

// Schema para validação do formulário
const formularioMedicoSchema = z.object({
  nomeBeneficiario: z.string().min(1, "Nome completo é obrigatório"),
  precCpMatriculaCpf: z.string().min(1, "Prec-CP/matrícula/CPF é obrigatório"),
  idade: z.string().min(1, "Idade é obrigatória"),
  postoGraduacaoTitular: z.string().min(1, "Posto/graduação do titular é obrigatório"),
  necessitaAcompanhante: z.enum(["sim", "nao"]),
  consultaExame: z.string().min(1, "Consulta/exame/procedimento solicitado é obrigatório"),
  
  // Campos da Divisão de Medicina
  profissionalCiente: z.string().optional(),
  justificativaProfissionalCiente: z.string().optional(),
  
  // Campos do Depósito de Material Cirúrgico
  materialDisponivel: z.string().optional(),
  justificativaMaterialDisponivel: z.string().optional(),
  
  // Campos do Centro Cirúrgico
  pacienteNoMapa: z.string().optional(),
  justificativaPacienteNoMapa: z.string().optional(),
  setorEmCondicoes: z.string().optional(),
  justificativaSetorEmCondicoes: z.string().optional(),
  
  // Campos da Unidade de Internação
  leitoReservado: z.string().optional(),
  justificativaLeitoReservado: z.string().optional(),
});

type FormularioMedicoData = z.infer<typeof formularioMedicoSchema>;

export default function FormularioMedicoParte1() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { requestId, formularioId } = router.query; // Captura o ID da solicitação e do formulário da URL

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormularioMedicoData>({
    resolver: zodResolver(formularioMedicoSchema),
    defaultValues: {
      necessitaAcompanhante: "nao",
      profissionalCiente: undefined,
      materialDisponivel: undefined,
      pacienteNoMapa: undefined,
      setorEmCondicoes: undefined,
      leitoReservado: undefined,
    }
  });

  // Buscar dados da solicitação para preencher os dados do paciente
  useEffect(() => {
    console.log('=== Página de cadastro médico ===');
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
        console.error('ID de solicitação ausente em todas as fontes');
        
        Swal.fire({
          title: 'Erro',
          text: 'ID da solicitação não encontrado. Verifique a URL e tente novamente.',
          icon: 'error',
          confirmButtonText: 'Voltar',
          customClass: {
            confirmButton: 'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
          },
        }).then(() => {
          // Redirecionar para a página de solicitações
          router.push('/solicitacoes');
        });
        return;
      }
      
      // Garantir que estamos usando o ID correto, com preferência para o da URL direta
      const actualRequestId = requestIdFromUrl || (Array.isArray(requestId) ? requestId[0] : requestId);
      console.log('ID de solicitação que será usado:', actualRequestId);
      
      try {
        setIsLoading(true);
        console.log(`Verificando existência da solicitação: /api/requests/verify?requestId=${actualRequestId}`);
        
        // Primeiro verificamos se a solicitação existe
        console.log('Verificando existência da solicitação via debug endpoint...');
        const debugResponse = await fetch(`/api/requests/debug/${actualRequestId}`);
        const debugResult = await debugResponse.json();
        console.log('Resultado do debug endpoint:', debugResult);
        
        // Agora verificamos pelo endpoint normal
        console.log('Verificando existência da solicitação pelo endpoint normal...');
        const verifyResponse = await fetch(`/api/requests/verify?requestId=${actualRequestId}`);
        
        if (!verifyResponse.ok) {
          if (verifyResponse.status === 404) {
            // Mostrar um diálogo perguntando se deseja criar uma solicitação de teste
            const result = await Swal.fire({
              title: 'Solicitação não encontrada',
              text: 'A solicitação com o ID informado não existe. Deseja criar uma solicitação de teste com esse ID?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sim, criar',
              cancelButtonText: 'Não, voltar',
              customClass: {
                confirmButton: 'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
                cancelButton: 'bg-gray-400 text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-gray-500',
              },
            });
            
            if (result.isConfirmed) {
              // Tentar criar a solicitação de teste
              try {
                const createResponse = await fetch('/api/requests/create-test', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ requestId })
                });
                
                if (!createResponse.ok) {
                  throw new Error(`Erro ao criar solicitação: ${createResponse.status}`);
                }
                
                const createResult = await createResponse.json();
                console.log('Solicitação de teste criada:', createResult);
                
                // Recarregar a página para usar a nova solicitação
                window.location.reload();
                return;
              } catch (createError) {
                console.error('Erro ao criar solicitação de teste:', createError);
                Swal.fire({
                  title: 'Erro',
                  text: 'Não foi possível criar a solicitação de teste.',
                  icon: 'error',
                  customClass: {
                    confirmButton: 'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
                  },
                });
                throw new Error('Erro ao criar solicitação de teste');
              }
            } else {
              // Redirecionar para a página anterior ou uma página segura
              router.push('/solicitacoes');
              throw new Error('Solicitação não encontrada');
            }
          } else {
            throw new Error(`Erro ao verificar solicitação: ${verifyResponse.status}`);
          }
        }
        
        console.log(`Buscando dados da solicitação: /api/requests/${actualRequestId}`);
        
        // Se a solicitação existir, continuamos com a busca dos dados completos
        const response = await fetch(`/api/requests/${actualRequestId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na resposta da API (${response.status}):`, errorText);
          
          // Se a solicitação não foi encontrada, mostrar um alerta ao usuário
          if (response.status === 404) {
            Swal.fire({
              title: 'Solicitação não encontrada',
              text: 'A solicitação com o ID informado não existe no sistema.',
              icon: 'error',
              customClass: {
                confirmButton: 'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
              },
            });
          }
          
          throw new Error(`Erro ao buscar dados da solicitação: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Log para debug
        console.log('Dados da solicitação recebidos:', data);
        
        // Adicionar log para ver toda a estrutura da resposta
        console.log('Estrutura completa da resposta:', JSON.stringify(data, null, 2));
        
        // Preencher os campos com os dados do paciente
        if (data.pacient) {
          console.log('Dados do paciente encontrados:', data.pacient);
          setValue('nomeBeneficiario', data.pacient.name || '');
          setValue('precCpMatriculaCpf', data.pacient.precCp || data.pacient.cpf || '');
          setValue('postoGraduacaoTitular', data.pacient.rank || '');
        } else {
          console.warn('Dados do paciente não encontrados na resposta da API');
        }
        
        // Se tivermos uma idade diretamente na solicitação
        if (data.pacientAge) {
          console.log('Usando idade da solicitação:', data.pacientAge);
          setValue('idade', data.pacientAge.toString());
        }
        // Se tivermos data de nascimento, calcular idade
        else if (data.pacient?.birthDate) {
          console.log('Calculando idade a partir da data de nascimento:', data.pacient.birthDate);
          const birthDate = new Date(data.pacient.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          setValue('idade', age.toString());
        } else {
          // Se não tivermos nenhuma informação de idade, usar string vazia
          console.warn('Nenhuma informação de idade encontrada');
          setValue('idade', '');
        }
        
        // Verificar se necessita acompanhante
        setValue('necessitaAcompanhante', data.needsCompanion ? 'sim' : 'nao');
        
        // Se a solicitação tiver uma descrição, usá-la como consulta/exame
        if (data.description) {
          setValue('consultaExame', data.description);
        }
        
        // Se tiver código CBHPM, incluí-lo na descrição do exame
        if (data.cbhpmCode) {
          const currentExame = data.description || '';
          setValue('consultaExame', `${currentExame} (Código CBHPM: ${data.cbhpmCode})`.trim());
        }
      } catch (error) {
        console.error('Erro ao buscar dados da solicitação:', error);
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
  }, [requestId, setValue]);

  // Buscar dados do formulário quando houver um formularioId
  useEffect(() => {
    const fetchFormulario = async () => {
      if (!formularioId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/formularios-medicos/formulario/${formularioId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do formulário');
        }
        
        const data = await response.json();
        
        // Log detalhado do formulário carregado
        console.log('Formulário carregado:', data);
        if (data.criadoPor) {
          console.log('Criado por:', data.criadoPor.name, '(', data.criadoPor.email, ')', 'Função:', data.criadoPor.role);
        }
        
        // Preencher o formulário com os dados obtidos
        // Usamos setValue para cada campo para evitar problemas de tipagem
        setValue('nomeBeneficiario', data.nomeBeneficiario || '');
        setValue('precCpMatriculaCpf', data.precCpMatriculaCpf || '');
        setValue('idade', data.idade || '');
        setValue('postoGraduacaoTitular', data.postoGraduacaoTitular || '');
        setValue('consultaExame', data.consultaExame || '');
        setValue('justificativaProfissionalCiente', data.justificativaProfissionalCiente || '');
        setValue('justificativaMaterialDisponivel', data.justificativaMaterialDisponivel || '');
        setValue('justificativaPacienteNoMapa', data.justificativaPacienteNoMapa || '');
        setValue('justificativaSetorEmCondicoes', data.justificativaSetorEmCondicoes || '');
        setValue('justificativaLeitoReservado', data.justificativaLeitoReservado || '');
        
        // Para campos booleanos e radios, precisamos de tratamento especial
        setValue('necessitaAcompanhante', data.necessitaAcompanhante === true ? 'sim' : 'nao');
        
        if (data.profissionalCiente !== undefined) {
          setValue('profissionalCiente', data.profissionalCiente === true ? 'sim' : 'nao');
        }
        
        if (data.materialDisponivel !== undefined) {
          setValue('materialDisponivel', data.materialDisponivel === true ? 'sim' : 'nao');
        }
        
        if (data.pacienteNoMapa !== undefined) {
          setValue('pacienteNoMapa', data.pacienteNoMapa === true ? 'sim' : 'nao');
        }
        
        if (data.setorEmCondicoes !== undefined) {
          setValue('setorEmCondicoes', data.setorEmCondicoes === true ? 'sim' : 'nao');
        }
        
        if (data.leitoReservado !== undefined) {
          setValue('leitoReservado', data.leitoReservado === true ? 'sim' : 'nao');
        }
        
        // Mostrar informações de quem criou o formulário
        if (data.criadoPor) {
          console.log(`Formulário criado por ${data.criadoPor.name} (${data.criadoPor.email}) em ${new Date(data.createdAt).toLocaleString()}`);
        }
        
        // Se o formulário estiver sendo carregado, usar o requestId dele
        if (data.requestId && !requestId) {
          router.replace({
            pathname: router.pathname,
            query: { ...router.query, requestId: data.requestId }
          });
        }
      } catch (error) {
        console.error('Erro ao buscar formulário:', error);
        Swal.fire({
          title: 'Erro',
          text: 'Não foi possível carregar os dados do formulário',
          icon: 'error',
          customClass: {
            confirmButton: 'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = e.target;
    setValue(name as keyof FormularioMedicoData, value);
  };

  const handleRadioChange = (fieldName: keyof FormularioMedicoData, value: string) => {
    setValue(fieldName, value);
  };

  const onSubmit = async (data: FormularioMedicoData) => {
    setIsSubmitting(true);
    
    try {
      if (!requestId) {
        throw new Error('ID da solicitação não fornecido');
      }
      
      // Transformar os campos de string para boolean antes de enviar para a API
      const dataToSubmit = {
        ...data,
        // Transformar campos de radio "sim"/"nao" para valores booleanos
        necessitaAcompanhante: data.necessitaAcompanhante === 'sim',
        profissionalCiente: data.profissionalCiente === 'sim',
        materialDisponivel: data.materialDisponivel === 'sim',
        pacienteNoMapa: data.pacienteNoMapa === 'sim',
        setorEmCondicoes: data.setorEmCondicoes === 'sim',
        leitoReservado: data.leitoReservado === 'sim'
      };
      
      // Verificar se estamos editando um formulário existente ou criando um novo
      const isEditing = formularioId !== undefined && formularioId !== null;
      
      // Enviar para a API de cadastro com o ID da solicitação
      // Isso salva os dados na tabela FormularioMedico com referência à solicitação (requestId)
      const formularioResponse = await fetch('/api/formularios-medicos/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dataToSubmit,
          id: isEditing ? formularioId : undefined, // Enviar ID se estiver editando
          requestId: requestId as string, // Vincula o formulário à solicitação original
          parte: 'OMS_DESTINO' // Indica que este formulário é da OMS de destino (organização B)
        }),
      });

      if (!formularioResponse.ok) {
        const error = await formularioResponse.json();
        throw new Error(error.message || 'Erro ao enviar formulário médico');
      }
      
      const formularioData = await formularioResponse.json();
      
      // Atualizar o fluxo da solicitação através da API de avaliação do Chefe de Divisão de Medicina
      // Este endpoint irá atualizar o status da solicitação para AGUARDANDO_CHEFE_SECAO_REGIONAL_3
      const avaliacaoResponse = await fetch('/api/avaliacoes/chefe-div-medicina', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId, // ID da solicitação original
          formularioId: formularioData.id // ID do formulário recém-criado
        }),
      });
      
      if (!avaliacaoResponse.ok) {
        const error = await avaliacaoResponse.json();
        throw new Error(error.message || 'Erro ao atualizar status da solicitação');
      }

      // Exibir mensagem de sucesso
      Swal.fire({
        title: 'Sucesso',
        text: 'Formulário médico enviado com sucesso e solicitação encaminhada para RM Destino',
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

  return (

      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-grafite">Formulário de Atendimento Médico - Chefe Divisão Medicina 4</h1>
        {isLoading ? (
          <Card>
            <div className="flex justify-center items-center p-10">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-verde" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <span className="ml-2">Carregando dados do {formularioId ? 'formulário' : 'paciente'}...</span>
            </div>
          </Card>
        ) : (
          <Card>
            {formularioId && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                <h3 className="font-semibold text-gray-700 mb-1">Informações do Formulário</h3>
                <p><span className="font-medium">ID:</span> {formularioId}</p>
                <p><span className="font-medium">Solicitação:</span> {requestId}</p>
                <p><span className="font-medium">Data de criação:</span> {new Date().toLocaleDateString()}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-7 gap-4">
            <div className="col-span-7 border-b border-gray-200 pb-2 mb-2">
              <h2 className="text-lg font-semibold text-grafite">Dados do Beneficiário</h2>
            </div>
            
            <Input
              label="Nome completo do beneficiário"
              divClassname="col-span-7"
              {...register('nomeBeneficiario')}
            />
            
            <Input
              label="Prec-CP/matrícula/CPF"
              divClassname="col-span-3 row-start-3"
              {...register('precCpMatriculaCpf')}
            />
            
            <Input
              label="Idade"
              divClassname="col-span-2 row-start-3"
              {...register('idade')}
            />
            
            <Input
              label="Posto/graduação do titular"
              divClassname="col-span-2 row-start-3"
              {...register('postoGraduacaoTitular')}
            />
            
            <div className="col-span-7 row-start-4 mb-2">
              <p className="mb-1 text-sm font-medium text-grafite">Necessita de acompanhante?</p>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    value="sim"
                    {...register('necessitaAcompanhante')}
                    className="h-4 w-4 text-verde focus:ring-verde" 
                  />
                  <span>Sim</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    value="nao"
                    {...register('necessitaAcompanhante')}
                    className="h-4 w-4 text-verde focus:ring-verde" 
                  />
                  <span>Não</span>
                </label>
              </div>
            </div>
            
            <div className="col-span-7 row-start-5">
              <label className="mb-1 block text-sm font-medium text-grafite">
                Consulta/exame/procedimento solicitado
              </label>
              <textarea
                className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                rows={3}
                {...register('consultaExame')}
              />
            </div>

            <div className="col-span-7 border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-base font-semibold text-grafite mb-2">DIVISÃO DE MEDICINA/DIVISÃO DE CLÍNICAS </h3>
              
              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">O profissional está ciente da data do agendamento para avaliação e realização do procedimento?</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="sim"
                      {...register('profissionalCiente')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="nao"
                      {...register('profissionalCiente')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Não</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">Em caso de negativa justificar:</p>
                <textarea
                  className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                  rows={2}
                  {...register('justificativaProfissionalCiente')}
                />
              </div>

              <div className="mt-4 mb-3">
                {/* <p className="mb-1 text-sm font-medium text-grafite">Assinatura:</p> */}
                {/* <div className="w-full border-b border-gray-400 h-6"></div> */}
                {/* <p className="text-center text-sm">Chefe da Divisão de Medicina</p> */}
              </div>
            </div>

            <div className="col-span-7 border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-base font-semibold text-grafite mb-2">DEPÓSITO DE MATERIAL CIRÚRGICO/FARMÁCIA/ SETOR OPME</h3>
              
              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">O material para a cirurgia e os OPME encontram-se disponíveis?</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="sim"
                      {...register('materialDisponivel')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="nao"
                      {...register('materialDisponivel')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Não</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">Em caso de negativa justificar:</p>
                <textarea
                  className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                  rows={2}
                  {...register('justificativaMaterialDisponivel')}
                />
              </div>

              <div className="mt-4 mb-3">
                {/* <p className="mb-1 text-sm font-medium text-grafite">Assinatura:</p> */}
                {/* <div className="w-full border-b border-gray-400 h-6"></div> */}
                {/* <p className="text-center text-sm">Chefe da Farmácia</p> */}
              </div>
            </div>

            <div className="col-span-7 border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-base font-semibold text-grafite mb-2">CENTRO CIRÚRGICO</h3>
              
              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">O nome do paciente consta no mapa cirúrgico referente ao dia do agendamento?</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="sim"
                      {...register('pacienteNoMapa')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="nao"
                      {...register('pacienteNoMapa')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Não</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">Em caso de negativa, justificar:</p>
                <textarea
                  className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                  rows={2}
                  {...register('justificativaPacienteNoMapa')}
                />
              </div>

              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">O setor está em condições de realizar o procedimento do beneficiário?</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="sim"
                      {...register('setorEmCondicoes')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="nao"
                      {...register('setorEmCondicoes')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Não</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">Em caso de negativa, justificar:</p>
                <textarea
                  className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                  rows={2}
                  {...register('justificativaSetorEmCondicoes')}
                />
              </div>

              <div className="mt-4 mb-3">
                {/* <p className="mb-1 text-sm font-medium text-grafite">Assinatura:</p> */}
                {/* <div className="w-full border-b border-gray-400 h-6"></div> */}
                {/* <p className="text-center text-sm">Chefe do Centro Cirúrgico</p> */}
              </div>
            </div>
            
            <div className="col-span-7 border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-base font-semibold text-grafite mb-2">UNIDADE DE INTERNAÇÃO</h3>
              
              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">Há leito reservado para o paciente?</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="sim"
                      {...register('leitoReservado')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      value="nao"
                      {...register('leitoReservado')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Não</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-grafite">Em caso de negativa, justificar:</p>
                <textarea
                  className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                  rows={2}
                  {...register('justificativaLeitoReservado')}
                />
              </div>

              <div className="mt-4 mb-3">
                {/* <p className="mb-1 text-sm font-medium text-grafite">Assinatura:</p> */}
                {/* <div className="w-full border-b border-gray-400 h-6"></div> */}
                {/* <p className="text-center text-sm">Chefe do Setor de Internação</p> */}
              </div>
            </div>
            

            
            <div className="col-span-7 mt-4">
              {/* <p className="text-sm text-red-600">As seções de ASSISTÊNCIA SOCIAL e TRASLADO estão na página separada de cadastro (Parte 2), destinada aos responsáveis da RM destino (Seç Sau Reg).</p> */}
            </div>
            
            <div className="col-span-7 mt-4 flex justify-end">
              <Button
                type="button"
                className="mr-2 bg-cinzaClaro text-grafite hover:bg-gray-300"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Formulário
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

  // Verificação de permissão - permitindo acesso ao CHEFE_DIV_MEDICINA
  if (role !== 'CHEFE_DIV_MEDICINA' && !checkPermission(role, 'requests:create')) {
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
