import { RequestStatus, Role } from '@prisma/client';
import { User } from 'next-auth';
import { Permission } from './permissions';
import permissionsByRole from './permissionsByRole';

export type UserType = User & {
  userId: string;
  role: Role | undefined;
};

export function checkPermission(
  role: Role | undefined,
  permission: Permission,
) {
  if (!role) {
    return false;
  }

  return permissionsByRole[role].has(permission);
}

export const terminalStatuses: RequestStatus[] = [
  RequestStatus.APROVADO,
  RequestStatus.REPROVADO,
  RequestStatus.CANCELADO,
  RequestStatus.REPROVADO_DSAU,
];

export const statusTransitions: Record<
  RequestStatus,
  {
    nextStatus: RequestStatus;
    previousStatus: RequestStatus | null;
    requiredRole: Role;
    onRejection?: RequestStatus;
    onCorrection?: {
      status: RequestStatus;
      requiredRole: Role;
      returnStatus: RequestStatus;
    };
  } | null
> = {
  [RequestStatus.AGUARDANDO_CHEFE_FUSEX_1]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_1,
    previousStatus: null,
    requiredRole: Role.CHEFE_FUSEX,
    onCorrection: {
      status: RequestStatus.NECESSITA_CORRECAO,
      requiredRole: Role.OPERADOR_FUSEX,
      returnStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_1
    }
  },
  [RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_1]: {
    nextStatus: RequestStatus.AGUARDANDO_AUDITOR,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_1,
    requiredRole: Role.CHEFE_AUDITORIA,
  },
  [RequestStatus.AGUARDANDO_AUDITOR]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_2,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_1,
    requiredRole: Role.AUDITOR,
  },
  [RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_2]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_2,
    previousStatus: RequestStatus.AGUARDANDO_AUDITOR,
    requiredRole: Role.CHEFE_AUDITORIA,
  },
  [RequestStatus.AGUARDANDO_CHEFE_FUSEX_2]: {
    nextStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_1,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_AUDITORIA_2,
    requiredRole: Role.CHEFE_FUSEX,
  },
  [RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_1]: {
    nextStatus: RequestStatus.AGUARDANDO_RESPOSTA,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_2,
    requiredRole: Role.HOMOLOGADOR,
  },
  [RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_1]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_1,
    previousStatus: null,
    requiredRole: Role.HOMOLOGADOR,
  },
  [RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_1]: {
    nextStatus: RequestStatus.AGUARDANDO_ESPECIALISTA,
    previousStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_1,
    requiredRole: Role.CHEFE_DIV_MEDICINA,
  },
  [RequestStatus.AGUARDANDO_ESPECIALISTA]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_2,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_1,
    requiredRole: Role.ESPECIALISTA,
  },
  [RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_2]: {
    nextStatus: RequestStatus.AGUARDANDO_COTACAO,
    previousStatus: RequestStatus.AGUARDANDO_ESPECIALISTA,
    requiredRole: Role.CHEFE_DIV_MEDICINA,
  },
  [RequestStatus.AGUARDANDO_COTACAO]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_3,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_2,
    requiredRole: Role.COTADOR,
  },
  [RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_3]: {
    nextStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_2,
    previousStatus: RequestStatus.AGUARDANDO_COTACAO,
    requiredRole: Role.CHEFE_DIV_MEDICINA,
  },
  [RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_2]: {
    nextStatus: RequestStatus.APROVADO,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_3,
    requiredRole: Role.HOMOLOGADOR,
  },
  [RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_2]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_3,
    previousStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_2,
    requiredRole: Role.HOMOLOGADOR,
  },
  [RequestStatus.AGUARDANDO_CHEFE_FUSEX_3]: {
    nextStatus: RequestStatus.AGUARDANDO_PASSAGEM,
    previousStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITADA_2,
    requiredRole: Role.CHEFE_FUSEX,
    //onRejection: RequestStatus.DEVOLVIDO_PARA_CORRECAO, // Adiciona a opção de devolução
  },
  [RequestStatus.AGUARDANDO_PASSAGEM]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_4,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_3,
    requiredRole: Role.OPERADOR_FUSEX,
  },
  [RequestStatus.AGUARDANDO_CHEFE_FUSEX_4]: {
    nextStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_3,
    previousStatus: RequestStatus.AGUARDANDO_PASSAGEM,
    requiredRole: Role.CHEFE_FUSEX,
  },
  [RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_3]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEM_1,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_4,
    requiredRole: Role.HOMOLOGADOR,
  },
  [RequestStatus.AGUARDANDO_CHEM_1]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_1,
    previousStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_3,
    requiredRole: Role.CHEM,
  },
  [RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_1]: {
    nextStatus: RequestStatus.AGUARDANDO_OPERADOR_SECAO_REGIONAL,
    previousStatus: RequestStatus.AGUARDANDO_CHEM_1,
    requiredRole: Role.CHEFE_SECAO_REGIONAL,
  },
  [RequestStatus.AGUARDANDO_OPERADOR_SECAO_REGIONAL]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_2,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_1,
    requiredRole: Role.OPERADOR_SECAO_REGIONAL,
  },
  [RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_2]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEM_2,
    previousStatus: RequestStatus.AGUARDANDO_OPERADOR_SECAO_REGIONAL,
    requiredRole: Role.CHEFE_SECAO_REGIONAL,
  },
  // [RequestStatus.AGUARDANDO_CHEM_2]: {
  //   nextStatus: RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_1,
  //   previousStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_2,
  //   requiredRole: Role.CHEM,
  // },
  [RequestStatus.AGUARDANDO_CHEM_2]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_2,
    requiredRole: Role.CHEM,
  },
  [RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3,
    previousStatus: RequestStatus.AGUARDANDO_CHEM_2,
    requiredRole: Role.CHEFE_DIV_MEDICINA,
  },
  [RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3]: {
    nextStatus: RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_1,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_DIV_MEDICINA_4,
    requiredRole: Role.CHEFE_SECAO_REGIONAL,
  },
  [RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_1]: {
    nextStatus: RequestStatus.AGUARDANDO_DRAS,
    previousStatus: RequestStatus.AGUARDANDO_CHEFE_SECAO_REGIONAL_3,
    requiredRole: Role.SUBDIRETOR_SAUDE,
  },
  [RequestStatus.AGUARDANDO_DRAS]: {
    nextStatus: RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_2,
    previousStatus: RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_1,
    requiredRole: Role.DRAS,
  },
  [RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_2]: {
    nextStatus: RequestStatus.AGUARDANDO_OPERADOR_PROCEDIMENTO_REALIZADO,
    previousStatus: RequestStatus.AGUARDANDO_DRAS,
    requiredRole: Role.SUBDIRETOR_SAUDE,
  },
  [RequestStatus.AGUARDANDO_OPERADOR_PROCEDIMENTO_REALIZADO]: {
    nextStatus: RequestStatus.AGUARDANDO_OPERADOR_FUSEX_CUSTOS,
    previousStatus: RequestStatus.AGUARDANDO_SUBDIRETOR_SAUDE_2,
    requiredRole: Role.OPERADOR_FUSEX,
  },
  [RequestStatus.AGUARDANDO_OPERADOR_FUSEX_CUSTOS]: {
    nextStatus: RequestStatus.APROVADO,
    previousStatus: RequestStatus.AGUARDANDO_OPERADOR_PROCEDIMENTO_REALIZADO,
    requiredRole: Role.OPERADOR_FUSEX,
  },
  // Status obsoleto - mantido apenas para compatibilidade
  // [RequestStatus.AGUARDANDO_CHEM_3]: null,
  [RequestStatus.APROVADO]: null,
  [RequestStatus.REPROVADO]: null,
  [RequestStatus.REPROVADO_DSAU]: {
    nextStatus: RequestStatus.AGUARDANDO_HOMOLOGADOR_SOLICITANTE_3,
    previousStatus: null,
    requiredRole: Role.SUBDIRETOR_SAUDE,
  },
  // Para quando o homologador deseja cancelar as respostas pendentes
  [RequestStatus.AGUARDANDO_RESPOSTA]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_3,
    previousStatus: null,
    requiredRole: Role.HOMOLOGADOR,
  },
  [RequestStatus.CANCELADO]: null,
  [RequestStatus.NECESSITA_CORRECAO]: {
    nextStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_1,
    previousStatus: null,
    requiredRole: Role.OPERADOR_FUSEX,
  },
  [RequestStatus.APROVADO_DSAU]: null,
  //[RequestStatus.DEVOLVIDO_PARA_CORRECAO]: {
  //  nextStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_3,
  //  previousStatus: RequestStatus.AGUARDANDO_CHEFE_FUSEX_3,
  //  requiredRole: Role.OPERADOR_FUSEX,
  //},
};