import { useState } from 'react';
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
  necessitaAcompanhante: z.string().transform((val) => val === "sim"),
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
  const { requestId } = router.query; // Captura o ID da solicitação da URL

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormularioMedicoData>({
    resolver: zodResolver(formularioMedicoSchema),
    defaultValues: {
      necessitaAcompanhante: false,
      profissionalCiente: undefined,
      materialDisponivel: undefined,
      pacienteNoMapa: undefined,
      setorEmCondicoes: undefined,
      leitoReservado: undefined,
    }
  });

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
      
      // Enviar para a API de cadastro com o ID da solicitação
      const formularioResponse = await fetch('/api/formularios-medicos/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          requestId: requestId as string,
          parte: 'OMS_DESTINO'
        }),
      });

      if (!formularioResponse.ok) {
        const error = await formularioResponse.json();
        throw new Error(error.message || 'Erro ao enviar formulário médico');
      }
      
      const formularioData = await formularioResponse.json();
      
      // Atualizar o fluxo da solicitação através da API de avaliação
      const avaliacaoResponse = await fetch('/api/avaliacoes/chefe-div-medicina', {
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
    <Layout>
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-grafite">Formulário de Atendimento Médico - OMS Destino</h1>
        <Card>
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

  // Verificação de permissão - ajuste conforme suas regras de permissão
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
