import { TRequestResponseWithReceiver } from "@/common-types";
import { RequestStatus, Role } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { z } from "zod";
import { terminalStatuses } from "@/permissions/utils";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "../common/button";
import Card from "../common/card";
import Input, { formatCurrency } from "../common/input";
import Select from "../common/select";
import modal from "../common/modal";
import { transformToBoolean } from "./RequestInfo";

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
      z.object({ responseId: z.string(), cost: z.coerce.number().optional() })
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
    name: "ticketCosts",
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
                  RequestStatus.REPROVADO,
                  RequestStatus.REPROVADO_DSAU,
                  RequestStatus.CANCELADO,
                  RequestStatus.APROVADO,
                ] as RequestStatus[]
              ).includes(response.status)
          )
          .map((response) => ({
            responseId: response.id,
            cost: response.ticketCost || undefined,
          })),
      });
    }
  }, [responses, reset]);

  const handleRemoveFile = (file: File) => {
    setSelectedFiles(selectedFiles.filter((f) => f.name !== file.name));
  };

  const handleNeedsCorrection = async () => {
    const formData = new FormData();
    formData.append("correction", "true");

    const response = await fetch(`/api/requests/${requestId}/status`, {
      method: "PATCH",
      body: formData,
    });
  };

  const handleCurrencyChange = (value: string, fieldOnChange: any) => {
    const intValue = parseInt(value.replace(/\D/g, ""), 10);
    fieldOnChange(intValue);
  };

  const submitForm = async (
    data: OpinionFormDataType & { cancelUnfinishedResponses?: boolean }
  ) => {
    if (
      status === RequestStatus.AGUARDANDO_PASSAGEM &&
      getValues("ticketCosts")?.some(
        (ticketCost) => ticketCost.cost === undefined
      )
    ) {
      Swal.fire({
        title: "Erro",
        icon: "error",
        text: "Todos os campos de orçamento devem ser preenchidos",
        customClass: {
          confirmButton:
            "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
        },
      });
      return;
    }

    const formData = new FormData();
    Object.entries({ ...data, files: selectedFiles }).forEach(
      ([key, value]) => {
        if (key === "files") {
          (value as File[]).forEach((file) => {
            formData.append("files", file);
          });
        } else if (Array.isArray(value)) {
          formData.append(`${key}[]`, JSON.stringify(value));
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      }
    );

    const response = await fetch(`/api/requests/${requestId}/status`, {
      method: "PATCH",
      body: formData,
    });

    if (response.ok) {
      router.push("/solicitacoes");
    } else {
      Swal.fire({
        title: "Erro",
        icon: "error",
        text: "Ocorreu um erro ao enviar o parecer",
        customClass: {
          confirmButton:
            "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
        },
      });
    }
  };

  const submitCorrection = async (data: OpinionFormDataType) => {
    const formData = new FormData();
    formData.append("favorable", "false");
    formData.append("observation", data.observation || "");

    const response = await fetch(`/api/requests/${requestId}/status`, {
      method: "PATCH",
      body: formData,
    });

    if (response.ok) {
      router.push("/solicitacoes");
    } else {
      Swal.fire({
        title: "Erro",
        icon: "error",
        text: "Ocorreu um erro ao devolver para correção",
        customClass: {
          confirmButton:
            "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
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
        title: "Cancelar respostas pendentes e continuar",
        text: "Ainda existem respostas pendentes. Se continuar, elas serão canceladas. Deseja prosseguir?",
        icon: "warning",
        onConfirm: () =>
          submitForm({ ...data, cancelUnfinishedResponses: true }),
      });
    } else {
      modal({
        onConfirm: () => submitForm(data),
      });
    }
  };

  const confirmCorrection = (data: OpinionFormDataType) => {
    modal({
      title: "Devolver para correção",
      text: "Deseja devolver este pedido para correção?",
      icon: "warning",
      onConfirm: () => submitCorrection(data),
    });
  };

  function handleSelectChange(e: any): void {
    const value = e.target.value === "true";
    setValue("favorable", value);
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
                  { label: "Sim", value: "true" },
                  { label: "Não", value: "false" },
                ]}
                {...register("favorable", {
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
                  {...register("observation")}
                />
              </div>
            </div>
          </Card>
          <div className="mt-3 flex items-center gap-4">
            <Button type="submit" className="max-w-40">
              Enviar escolha
            </Button>
            {userRole === Role.CHEFE_FUSEX && (
              <Button
                color="danger"
                onClick={handleSubmit(handleNeedsCorrection)}
                className="w-fit"
              >
                Devolver para correção
              </Button>
            )}
          </div>
        </>
      )}
    </form>
  );
}
