/* eslint-disable jsx-a11y/control-has-associated-label */
import { Controller, useForm } from 'react-hook-form';
import { RequestResponse } from '@prisma/client';
import Swal from 'sweetalert2';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import Button from '../common/button';
import Input, { formatCurrency } from '../common/input';
import CurrencyInput from '../common/input/CurrencyInput';
import modal from '../common/modal';

const responseFormSchema = z.object({
  procedureCost: z.coerce.number(),
  opmeCost: z.coerce.number(),
  ticketCost: z.coerce.number().optional(),
});

type ResponseFormDataType = z.infer<typeof responseFormSchema>;

export default function RequestResponseInfo({
  requestResponse,
}: {
  requestResponse?: RequestResponse;
}) {
  const { handleSubmit, control } = useForm<ResponseFormDataType>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: requestResponse
      ? {
          procedureCost: requestResponse.procedureCost || undefined,
          opmeCost: requestResponse.opmeCost || undefined,
          ticketCost: requestResponse.ticketCost || undefined,
        }
      : {},
  });

  const router = useRouter();
  const { requestResponseId } = router.query;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFilesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFilesArray]);
    }
  };

  const handleRemoveFile = (file: File) => {
    setSelectedFiles(selectedFiles.filter((f) => f.name !== file.name));
  };

  // Não precisamos mais dessa função pois o CurrencyInput lida com a formatação internamente

  const onSubmit = async (data: ResponseFormDataType) => {
    const formData = new FormData();
    Object.entries({ ...data, files: selectedFiles }).forEach(
      ([key, value]) => {
        if (key === 'files') {
          (value as File[]).forEach((file) => {
            formData.append('files', file);
          });
        } else if (key !== 'ticketCost') {
          formData.append(key, value.toString());
        }
      },
    );

    const response = await fetch(`/api/responses/${requestResponseId}`, {
      method: 'PUT',
      body: formData,
    });

    if (response.ok) {
      router.push('/solicitacoes');
    } else {
      Swal.fire({
        title: 'Erro',
        text: 'Ocorreu um erro ao enviar a solicitação',
        icon: 'error',
        customClass: {
          confirmButton:
            'bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro',
        },
      });
    }
  };

  const submitConfirmation = async (data: ResponseFormDataType) => {
    modal({
      onConfirm: () => onSubmit(data),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submitConfirmation)}
      className="grid grid-cols-2 gap-4"
    >
      <div className="relative col-span-1">
        <Controller
          name="procedureCost"
          control={control}
          rules={{ required: true }}
          defaultValue={0}
          render={({ field }) => (
            <CurrencyInput
              label="Custo do procedimento"
              value={field.value}
              onChange={field.onChange}
              disabled={!!requestResponse}
            />
          )}
        />
      </div>
      <Controller
        name="opmeCost"
        control={control}
        rules={{ required: true }}
        defaultValue={0}
        render={({ field }) => (
          <CurrencyInput
            label="Custo de OPME"
            value={field.value}
            onChange={field.onChange}
            disabled={!!requestResponse}
          />
        )}
      />
      {(requestResponse?.ticketCost || requestResponse?.ticketCost === 0) && (
        <Controller
          name="ticketCost"
          control={control}
          rules={{ required: true }}
          defaultValue={0}
          render={({ field }) => (
            <CurrencyInput
              label="Custo passagem"
              value={field.value || 0}
              onChange={field.onChange}
              disabled={!!requestResponse}
            />
          )}
        />
      )}
      {typeof requestResponse?.procedureCost === 'number' &&
        typeof requestResponse?.opmeCost === 'number' && (
          <Input
            value={formatCurrency(
              requestResponse.procedureCost +
                requestResponse.opmeCost +
                (requestResponse?.ticketCost || 0),
            )}
            label="Custo total"
            divClassname="col-span-4 row-start-2"
            disabled={!!requestResponse}
          />
        )}
      {!requestResponse && (
        <>
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
          <Button type="submit" className="row-start-3">
            Submeter cotação
          </Button>
        </>
      )}
    </form>
  );
}
