/* eslint-disable jsx-a11y/control-has-associated-label */
import { Controller, useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { Request, Pacient, RequestStatus, Role } from "@prisma/client";
import Swal from "sweetalert2";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import ReactSelect from "react-select";
import fetcher from "@/fetcher";
import useSWR from "swr";
import { cbhpmInfo } from "@/data/cbhpm/codes";
import AsyncSelect from "react-select/async";
import { debounce } from "lodash";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "../common/button";
import Input, { formatCurrency } from "../common/input";
import SpinLoading from "../common/loading/SpinLoading";
import Select from "../common/select";
import modal from "../common/modal";
import { useSession } from "next-auth/react";
import { UserType } from "@/permissions/utils";

export const transformToBoolean = (value: string) => value === "true";

const normalizeString = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "");

    
    const requestFormSchema = z.object({
      precCp: z.string(),
      cpf: z.string(),
      name: z.string(),
      rank: z.string(),
      isDependent: z.string().transform(transformToBoolean).or(z.boolean()),
      cbhpmCode: z.object({
        id: z.string(),
        description: z.string(),
        version: z.string(),
      }),
      needsCompanion: z.string().transform(transformToBoolean).or(z.boolean()),
      opmeCost: z.coerce.number(),
      psaCost: z.coerce.number(),
      requestedOrganizations: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
        )
        .nonempty(),
      });
      
      type RequestFormDataType = z.infer<typeof requestFormSchema>;
      
      export default function RequestInfo({
        request,
      }: {
        request?: Request & {
          pacient: Pacient;
          sender?: {
            name: string;
          };
          requestedOrganizations: {
            id: string;
            name: string;
          }[];
        };
      }) {
        const {data : session} = useSession()
        const { role } = session?.user as UserType;
        
        const isInputDisabled = useMemo(
          () => {
            const authorizedToEdit: RequestStatus[] = [RequestStatus.AGUARDANDO_RESPOSTA, RequestStatus.NECESSITA_CORRECAO]
      return request?.status && !authorizedToEdit.includes(request?.status)
    },
    [request]
  );

  const { register, setValue, handleSubmit, control } =
    useForm<RequestFormDataType>(
      request
        ? {
            resolver: zodResolver(requestFormSchema),
            disabled: isInputDisabled,
            defaultValues: {
              ...request.pacient,
              cbhpmCode: cbhpmInfo.find(
                (cbhpm) => cbhpm.id === request.cbhpmCode
              ),
              needsCompanion: request.needsCompanion,
              opmeCost: request.opmeCost,
              psaCost: request.psaCost || undefined,
              requestedOrganizations: request.requestedOrganizations?.map(
                (org) => ({
                  value: org.id,
                  label: org.name,
                })
              ),
            },
          }
        : {
            resolver: zodResolver(requestFormSchema),
          }
    );

  const router = useRouter();

  const [isSearchingPacient, setIsSearchingPacient] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: organizations } = useSWR<
    {
      id: string;
      name: string;
    }[]
  >(!request ? "/api/organizations" : null, fetcher, {
    revalidateOnFocus: false,
  });

  const organizationOptions = organizations?.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const cbhpmOptions = cbhpmInfo.map((cbhpm) => ({
    value: cbhpm.id,
    label: `${cbhpm.id} (${cbhpm.version}) - ${cbhpm.description}`,
  }));

  const loadCbhpmOptions = debounce((inputValue, callback) => {
    const filteredOptions = cbhpmOptions.filter((option) =>
      normalizeString(option.label).includes(normalizeString(inputValue))
    );
    callback(
      filteredOptions.map((option) => ({
        value: option.value,
        label: option.label,
      }))
    );
  }, 500);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = e.target;
    setValue(name as keyof RequestFormDataType, value);
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

  const autoFillForm = async (cpf: string) => {
    if (cpf.length !== 11) return;

    setIsSearchingPacient(true);
    const response = await fetch(`/api/pacients/${cpf}`);
    const pacient = await response.json();
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    setIsSearchingPacient(false);

    if (!pacient) return;

    setValue("precCp", pacient.precCp);
    setValue("name", pacient.name);
    setValue("rank", pacient.rank);
    setValue("isDependent", pacient.isDependent);
  };

  const handleCurrencyChange = (value: string, fieldOnChange: any) => {
    const intValue = parseInt(value.replace(/\D/g, ""), 10);
    fieldOnChange(intValue);
  };

  const onSubmit = async (data: RequestFormDataType) => {
    const formData = new FormData();
    Object.entries({ ...data, files: selectedFiles }).forEach(
      ([key, value]) => {
        if (key === "files") {
          (value as File[]).forEach((file) => {
            formData.append("files", file);
          });
        } else if (key === "requestedOrganizations") {
          formData.append(
            "requestedOrganizationIds[]",
            JSON.stringify(
              (value as { value: string; label: string }[]).map(
                (org) => org.value
              )
            )
          );
        } else if (key === "cbhpmCode") {
          formData.append("cbhpmCode", (value as { id: string }).id);
        } else if (typeof value === "boolean" || typeof value === "number") {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value as string);
        }
      }
    );

    const response = await fetch("/api/requests", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      router.push("/solicitacoes");
    } else {
      Swal.fire({
        title: "Erro",
        text: "Ocorreu um erro ao enviar a solicitação",
        icon: "error",
        customClass: {
          confirmButton:
            "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
        },
      });
    }
  };

  const submitConfirmation = async (data: RequestFormDataType) => {
    modal({
      onConfirm: () => onSubmit(data),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submitConfirmation)}
      className="grid grid-cols-7 gap-4"
    >
      <div className="relative col-span-1">
        <Input
          label="CPF"
          {...register("cpf", {
            required: true,
            minLength: 11,
            maxLength: 11,
            pattern: /^[0-9]*$/,
            onBlur: (e) => autoFillForm(e.target.value),
          })}
        />
        <div
          className={`absolute ${isSearchingPacient ? "block" : "hidden"} bottom-1 right-1`}
        >
          <SpinLoading />
        </div>
      </div>
      <Input
        label="Prec-CP"
        divClassname="col-span-1"
        {...register("precCp", {
          required: true,
          disabled: isSearchingPacient,
        })}
      />
      <Input
        label="Nome"
        divClassname="col-span-3 row-start-2"
        {...register("name", {
          required: true,
          disabled: isSearchingPacient,
        })}
      />
      <Input
        label="Posto/Graduação"
        divClassname="col-span-2 row-start-2"
        {...register("rank", {
          required: true,
          disabled: isSearchingPacient,
        })}
      />
      <Select
        label="Dependente?"
        options={[
          { label: "Não", value: "false" },
          { label: "Sim", value: "true" },
        ]}
        divClassname="row-start-2"
        {...register("isDependent", {
          onChange: (e) => handleSelectChange(e),
          disabled: isSearchingPacient,
        })}
      />
      <div className="col-span-3 row-start-3 flex flex-col gap-1">
        <span className="font-semibold text-grafite">Código CBHPM</span>
        <Controller
          name="cbhpmCode"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              ref={field.ref}
              cacheOptions
              defaultOptions
              loadOptions={loadCbhpmOptions}
              value={
                field.value
                  ? {
                      value: field.value.id,
                      label: `${field.value.id} (${field.value.version}) - ${field.value.description}`,
                    }
                  : null
              }
              onChange={(value) =>
                field.onChange(
                  cbhpmInfo.find((cbhpm) => cbhpm.id === value?.value)
                )
              }
              isDisabled={isInputDisabled}
            />
          )}
        />
      </div>
      <Select
        label="Necessita acompanhante?"
        options={[
          { label: "Não", value: "false" },
          { label: "Sim", value: "true" },
        ]}
        divClassname="row-start-3 whitespace-nowrap"
        {...register("needsCompanion", {
          onChange: (e) => handleSelectChange(e),
        })}
      />
      <Controller
        name="opmeCost"
        control={control}
        rules={{ required: true }}
        defaultValue={0}
        render={({ field }) => (
          <Input
            label="Custo OPME estimado"
            type="text"
            divClassname="col-span-2 row-start-4"
            value={formatCurrency(field.value)}
            onChange={(e) =>
              handleCurrencyChange(e.target.value, field.onChange)
            }
            disabled={isInputDisabled}
          />
        )}
      />
      <Controller
        name="psaCost"
        control={control}
        rules={{ required: true }}
        defaultValue={0}
        render={({ field }) => (
          <Input
            label="Custo OCS/PSA Total"
            type="text"
            divClassname="col-span-2 row-start-4"
            value={formatCurrency(field.value)}
            onChange={(e) =>
              handleCurrencyChange(e.target.value, field.onChange)
            }
            disabled={isInputDisabled}
          />
        )}
      />
      {!router.pathname.includes("recebidas") && (
        <div className="col-span-2 row-start-5 flex flex-col gap-1">
          <span className="font-semibold text-grafite">OMS de referência</span>
          <Controller
            name="requestedOrganizations"
            control={control}
            render={({ field }) => (
              <ReactSelect
                ref={field.ref}
                isMulti
                value={field.value}
                options={organizationOptions}
                onChange={(value) => field.onChange(value)}
                isDisabled={isInputDisabled}
              />
            )}
          />
        </div>
      )}
      {!request && (
        <>
          <div className="row-start-6 flex flex-col items-start gap-1">
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
          <Button type="submit" className="row-start-7">
            Enviar
          </Button>
        </>
      )}
      {request && request.status === RequestStatus.NECESSITA_CORRECAO && role === Role.OPERADOR_FUSEX && (
        <Button type="button" 
        onClick={handleSubmit(submitConfirmation)}
        className="row-start-7" >
          Corrigir
        </Button>
      )}
    </form>
  );
}
