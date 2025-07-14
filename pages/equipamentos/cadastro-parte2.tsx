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

  const handleRadioChange = (fieldName: keyof FormularioMedicoParte2Data, value: string) => {
    setValue(fieldName, value === "sim");
  };

  const onSubmit = async (data: FormularioMedicoParte2Data) => {
    setIsSubmitting(true);
    
    try {
      // Enviar para a API apenas os dados da parte 2
      const response = await fetch('/api/formularios-medicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          parte: 'RM_DESTINO'
        }),
      });

      if (response.ok) {
        Swal.fire({
          title: 'Sucesso',
          text: 'Formulário médico enviado com sucesso',
          icon: 'success',
          customClass: {
            confirmButton:
              'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
          },
        }).then(() => {
          router.push('/solicitacoes');
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar formulário médico');
      }
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
        <h1 className="text-2xl font-bold text-grafite">Formulário de Atendimento Médico - RM Destino (Seç Sau Reg)</h1>
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
                      {...register('hotelReservado')}
                      className="h-4 w-4 text-verde focus:ring-verde" 
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      value="nao"
                      {...register('hotelReservado')}
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
                    {...register('justificativaHotel')}
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
                        Horário:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario1')}
                      />
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
                        Horário:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario2')}
                      />
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
                        Horário:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario3')}
                      />
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
                        Horário:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-cinzaClaro px-3 py-2 text-sm text-grafite focus:border-verdeEscuro focus:outline-none"
                        {...register('horario4')}
                      />
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
            
            <div className="col-span-7 mt-4 flex justify-between">
              <Button
                type="button"
                className="bg-cinzaClaro text-grafite hover:bg-gray-300"
                onClick={() => router.back()}
              >
                Voltar
              </Button>
              <div>
                <Button
                  type="button"
                  className="mr-2 bg-cinzaClaro text-grafite hover:bg-gray-300"
                  onClick={() => router.push('/solicitacoes')}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Cadastrar
                </Button>
              </div>
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
