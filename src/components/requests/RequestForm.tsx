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
    // Remove currency symbol (R$) and thousand separators (.)
    const cleanValue = value.replace(/R\$|\./g, '');
    // Replace comma with dot for decimal
    const normalizedValue = cleanValue.replace(',', '.');
    // Parse as float to preserve decimal places
    const floatValue = parseFloat(normalizedValue) || 0;
    fieldOnChange(floatValue);
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
    formData.append("observation", data.observation || "");
    
    // Adicionar arquivos se houver
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
    }

    const response = await fetch(`/api/requests/${requestId}/correction`, {
      method: "PATCH",
      body: formData,
    });

    if (response.ok) {
      router.push("/solicitacoes");
    } else {
      const error = await response.json();
      Swal.fire({
        title: "Erro",
        icon: "error",
        text: error.message || "Ocorreu um erro ao processar a correção",
        customClass: {
          confirmButton:
            "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
        },
      });
    }
  };

  const cancelRequest = async () => {
    const formData = new FormData();
    formData.append("cancel", "true");
    formData.append("observation", "Solicitação cancelada pelo Operador FUSEX");

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
        text: "Ocorreu um erro ao cancelar a solicitação",
        customClass: {
          confirmButton:
            "bg-verde text-white border-none py-2 px-4 text-base cursor-pointer hover:bg-verdeEscuro",
        },
      });
    }
  };

  const confirmCancelation = () => {
    modal({
      title: "Cancelar solicitação",
      text: "Deseja cancelar esta solicitação? Esta ação é irreversível e encerrará o fluxo para todos os usuários envolvidos.",
      icon: "warning",
      onConfirm: cancelRequest,
    });
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
    } else if (userRole === Role.OPERADOR_FUSEX) {
      modal({
        title: "Confirmar envio",
        text: "Deseja enviar esta solicitação para o próximo agente do fluxo?",
        icon: "question",
        onConfirm: () => submitForm(data),
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
      text: userRole === Role.OPERADOR_FUSEX
        ? "Deseja devolver esta solicitação para correção? Isto irá retornar a solicitação para o operador responsável."
        : "Deseja devolver este pedido para correção?",
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
      {userRole === Role.OPERADOR_FUSEX ? (
        <>
          <h2 className="text-xl font-bold text-grafite">Parecer</h2>
          <Card>
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-grafite">Observações</span>
                <textarea
                  placeholder="Digite suas observações aqui..."
                  rows={3}
                  className="w-full rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
                  {...register("observation")}
                />
              </div>
            </div>
          </Card>
          <div className="mt-3 flex items-center gap-4">
            <Button type="submit" className="max-w-40">
              Enviar para o próximo
            </Button>
            <Button
              color="secondary"
              onClick={handleSubmit(confirmCorrection)}
              className="w-fit"
            >
              Devolver para correção
            </Button>
            <Button
              color="danger"
              onClick={confirmCancelation}
              className="w-fit"
            >
              Cancelar Solicitação
            </Button>
          </div>
        </>
      ) : status === RequestStatus.NECESSITA_CORRECAO ? (
        <>
          <h2 className="text-xl font-bold text-grafite">Corrigir Solicitação</h2>
          <Card>
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-grafite">Observações para Correção</span>
                <textarea
                  placeholder="Adicione informações para correção..."
                  rows={3}
                  className="w-full rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
                  {...register("observation")}
                />
              </div>
            </div>
          </Card>
          <div className="mt-3 flex items-center gap-4">
            <Button type="submit" className="max-w-40">
              Reenviar Solicitação Corrigida
            </Button>
          </div>
        </>
      ) : (
        !(status === RequestStatus.AGUARDANDO_RESPOSTA && !responses) && (
          <>
            <h2 className="text-xl font-bold text-grafite">Parecer</h2>
            <Card>
              <div className="flex w-full flex-col gap-2">
                <Select
                  label="ENCAMINHAR PARA ANÁLISE?"
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
                  <span className="font-medium text-grafite">Justificativa</span>
                  <textarea
                    placeholder="Digite sua justificativa aqui..."
                    rows={3}
                    className="w-full rounded border border-gray-300 px-2 text-grafite focus:outline-0 focus:ring focus:ring-verde"
                    {...register("observation")}
                  />
                </div>
              </div>
            </Card>
            <div className="mt-3 flex items-center gap-4">
              <Button type="submit" className="max-w-40">
                Enviar
              </Button>
              <Button
                color="danger"
                onClick={handleSubmit(confirmCorrection)}
                className="w-fit"
              >
                Devolver para correção
              </Button>
            </div>
          </>
        )
      )}
    </form>
  );
}
