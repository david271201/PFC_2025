/* eslint-disable jsx-a11y/control-has-associated-label */
import { TRequestResponseWithReceiver } from '@/common-types';
import { RequestStatus, Role } from '@prisma/client';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { terminalStatuses } from '@/permissions/utils';
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/button';
import Card from '../common/card';
import Input, { formatCurrency } from '../common/input';
import Select from '../common/select';
import modal from '../common/modal';
import { transformToBoolean } from './RequestInfo';

const opinionFormSchema = z.object({
  favorable: z
    .string()
    .transform(transformToBoolean)
    .or(z.boolean())
    .optional(),
  observation: z.string().optional(),
  selectedAuditor: z
    .object({
      value: z.string(),
      label: z.string(),
    })
    .optional(),
  ticketCosts: z
    .array(
      z.object({ responseId: z.string(), cost: z.coerce.number().optional() }),
    )
    .optional(),
  selectedResponseId: z.string().optional(),
});

type OpinionFormDataType = z.infer<typeof opinionFormSchema>;

export default function RequestForm({
  status,
  responses,
  userRole,
}: {
  status: RequestStatus | undefined;
  responses: TRequestResponseWithReceiver[] | undefined;
  userRole: Role | undefined;
}) {
  const { register, reset, setValue, handleSubmit, getValues, control } =
    useForm<OpinionFormDataType>({
      resolver: zodResolver(opinionFormSchema),
      defaultValues: {
        favorable: true,
        ticketCosts: [],
      },
    });

  const { fields } = useFieldArray({
    control,
    name: 'ticketCosts',
  });

  const router = useRouter();
  const { requestId } = router.query;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const isAllResponsesFinished =
    responses &&
    responses.every((item) => terminalStatuses.includes(item.status));

  useEffect(() => {
    if (responses) {
      reset({
        favorable: true,
        ticketCosts: responses
          .filter(
            (response) =>
              !(
                [
                  RequestStatus.CANCELADO,
                  RequestStatus.REPROVADO,
                ] as RequestStatus[]
              ).includes(response.status),
          )
          .map((response) => ({
            responseId: response.id,
            cost: response.ticketCost || undefined,
          })),
      });
    }
  }, [responses, reset]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = e.target;
    setValue(name as keyof OpinionFormDataType, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFilesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFilesArray]);
    }
  };

  const handleRemoveFile = (file: File) => {
    setSelectedFiles(selectedFiles.filter((f) => f.name !== file.name));
  };

  const handleCurrencyChange = (value: string, fieldOnChange: any) => {
    const intValue = parseInt(value.replace(/\D/g, ''), 10);
    fieldOnChange(intValue);
  };

  const submitForm = async (
    data: OpinionFormDataType & { cancelUnfinishedResponses?: boolean },
  ) => {
    if (
      status === RequestStatus.AGUARDANDO_PASSAGEM &&
      getValues('ticketCosts')?.some(
        (ticketCost) => ticketCost.cost === undefined,
      )
    ) {
      Swal.fire({
        title: 'Erro',
        icon: 'error',
        text: 'Todos os campos de orçamento devem ser preenchidos',
        customClass: {
          confirmButton:
            'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
        },
      });
      return;
    }

    const formData = new FormData();
    Object.entries({ ...data, files: selectedFiles }).forEach(
      ([key, value]) => {
        if (key === 'files') {
          (value as File[]).forEach((file) => {
            formData.append('files', file);
          });
        } else if (Array.isArray(value)) {
          formData.append(`${key}[]`, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      },
    );

    const response = await fetch(`/api/requests/${requestId}/status`, {
      // verifica se é escolha da OMS ou não
      method:
        status !== RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_3
          ? 'PATCH'
          : 'PUT',
      body: formData,
    });

    if (response.ok) {
      router.push('/solicitacoes');
    } else {
      Swal.fire({
        title: 'Erro',
        icon: 'error',
        text: 'Ocorreu um erro ao enviar o parecer',
        customClass: {
          confirmButton:
            'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
        },
      });
    }
  };

  const submitConfirmation = async (data: OpinionFormDataType) => {
    if (
      status === RequestStatus.AGUARDANDO_RESPOSTA &&
      userRole === Role.HOMOLOGADOR &&
      !isAllResponsesFinished
    ) {
      modal({
        title: 'Cancelar respostas pendentes e continuar',
        text: 'Ainda existem respostas pendentes. Se continuar, elas serão canceladas. Deseja prosseguir?',
        icon: 'warning',
        onConfirm: () =>
          submitForm({ ...data, cancelUnfinishedResponses: true }),
      });
    } else {
      modal({
        onConfirm: () => submitForm(data),
      });
    }
  };

  const handleCancelRequest = async (observation: string) => {
    const response = await fetch(`/api/requests/${requestId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ observation }),
    });

    if (response.ok) {
      modal({
        title: 'Sucesso',
        text: 'Solicitação cancelada com sucesso',
        icon: 'success',
        showCancelButton: false,
        onConfirm: () => {
          router.push('/solicitacoes');
        },
      });
    } else {
      modal({
        title: 'Erro',
        text: 'Ocorreu um erro ao cancelar a solicitação',
        icon: 'error',
        showCancelButton: false,
      });
    }
  };

  const confirmCancelRequest = () => {
    modal({
      text: 'Qual a justificativa para cancelar a solicitação?',
      input: 'text',
      preConfirm: (observation: string) => handleCancelRequest(observation),
      showLoaderOnConfirm: true,
    });
  };

  if (status === RequestStatus.AGUARDANDO_PASSAGEM && responses) {
    return (
      <form
        onSubmit={handleSubmit(submitConfirmation)}
        className="flex w-full flex-col gap-2"
      >
        <h2 className="w-full border-b-2 border-cinzaClaro text-xl font-bold text-grafite">
          Orçamento de passagens
        </h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex w-full flex-col justify-center gap-2 rounded-lg border-2 border-cinzaClaro bg-white p-2"
          >
            <div className="flex gap-4">
              <span className="font-medium text-grafite">
                {responses[index].receiver.name}:
              </span>
              <Controller
                name={`ticketCosts.${index}.cost` as const}
                control={control}
                rules={{ required: true }}
                defaultValue={0}
                render={({ field: f }) => (
                  <Input
                    type="text"
                    value={formatCurrency(f.value || 0)}
                    onChange={(e) =>
                      handleCurrencyChange(e.target.value, f.onChange)
                    }
                  />
                )}
              />
            </div>
          </div>
        ))}
        <Button type="submit" className="mt-3 max-w-40">
          Enviar orçamento
        </Button>
      </form>
    );
  }

  if (
    status === RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_3 &&
    responses
  ) {
    const options = responses
      .filter((response) => response.status === RequestStatus.APROVADO)
      .map((response) => ({
        value: response.id,
        label: response.receiver.name,
      }));

    return (
      <form
        onSubmit={handleSubmit(submitConfirmation)}
        className="flex w-full flex-col gap-2"
      >
        <h2 className="w-full border-b-2 border-cinzaClaro text-xl font-bold text-grafite">
          Escolher OMS para evacuação
        </h2>
        <Card>
          <div className="flex w-full flex-col gap-2">
            <Select
              label="Para qual OMS deseja evacuar?"
              options={options}
              divClassname="whitespace-nowrap w-fit"
              {...register('selectedResponseId', {
                required: true,
              })}
            />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-grafite">Justificativa</span>
              <textarea
                placeholder="Digite sua observação aqui..."
                rows={3}
                className="w-full rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
                {...register('observation')}
              />
            </div>
          </div>
        </Card>
        <div className="mt-3 flex items-center gap-4">
          <Button type="submit" className="max-w-40">
            Enviar escolha
          </Button>
          {userRole === Role.HOMOLOGADOR && (
            <Button
              color="danger"
              onClick={confirmCancelRequest}
              className="w-fit"
            >
              Cancelar solicitação
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(submitConfirmation)}
      className="flex w-full flex-col gap-2"
    >
      {!(status === RequestStatus.AGUARDANDO_RESPOSTA && !responses) && (
        <>
          <h2 className="text-xl font-bold text-grafite">Parecer</h2>
          <Card>
            <div className="flex w-full flex-col gap-2">
              <Select
                label="Favorável?"
                options={[
                  { label: 'Sim', value: 'true' },
                  { label: 'Não', value: 'false' },
                ]}
                {...register('favorable', {
                  required: true,
                  onChange: (e) => handleSelectChange(e),
                })}
                divClassname="w-fit"
              />
              <div className="flex flex-col gap-1">
                <span className="font-medium text-grafite">Observações</span>
                <textarea
                  placeholder="Digite sua observação aqui..."
                  rows={3}
                  className="w-full rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
                  {...register('observation')}
                />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium text-grafite">Anexos</span>
                <div className="flex items-center gap-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="relative flex flex-col items-center justify-center rounded-md border border-dashed border-gray-400 bg-cinzaClaro/50 p-4"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file)}
                        className="absolute right-2 top-2"
                      >
                        <XMarkIcon className="size-4 stroke-gray-600" />
                      </button>
                      <DocumentIcon className="size-6 w-full stroke-gray-400" />
                      <span className="text-sm font-medium text-grafite">
                        {file.name}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-400 bg-cinzaClaro/50 p-4">
                    <ArrowUpTrayIcon className="size-6 w-full stroke-gray-400" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-500">
                        Adicionar arquivo
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        multiple
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
      <div className="mt-3 flex items-center gap-4">
        {!(status === RequestStatus.AGUARDANDO_RESPOSTA && !responses) && (
          <Button type="submit" className="max-w-40">
            Enviar
          </Button>
        )}
        {userRole === Role.HOMOLOGADOR && (
          <Button
            color="danger"
            onClick={confirmCancelRequest}
            className="w-fit"
          >
            Cancelar solicitação
          </Button>
        )}
      </div>
    </form>
  );
}
