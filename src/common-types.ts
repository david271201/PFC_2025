import {
  Pacient,
  Request,
  RequestResponse,
  Role,
  ActionLog,
} from '@prisma/client';

export type TActionLogWithUserInfo = ActionLog & {
  userName: string;
  userRole: Role;
  userOrganization: string;
};

export type TRequestInfo = Request & {
  pacient: Pacient;
  senderId: string;
  sender: {
    name: string;
  };
  requestedOrganizations: {
    id: string;
    name: string;
  }[];
  requestActions: TActionLogWithUserInfo[];
};

export type TRequestResponseWithReceiver = RequestResponse & {
  receiver: {
    id: string;
    name: string;
  };
  actions: TActionLogWithUserInfo[];
};

export type TCusto = {
  id: string;
  descricao: string;
  valor: number;
  requestId: string;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
  usuario?: {
    name: string;
  };
};

export type TRequestInfoWithResponses = TRequestInfo & {
  requestResponses?: TRequestResponseWithReceiver[];
  formulariosRegistrados?: Array<{
    id: string;
    consultaExame: string;
    createdAt: string;
  }>;
  custos?: TCusto[];
};

export type TRequestResponseWithRequestInfo = RequestResponse & {
  request: TRequestInfo;
  actions: TActionLogWithUserInfo[];
};
