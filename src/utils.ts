import { RequestStatus, Role } from '@prisma/client';
import { statusTransitions } from './permissions/utils';

/* eslint-disable import/prefer-default-export */
export function isStatusForRole(
  status: RequestStatus | undefined,
  role: Role | undefined,
): boolean {
  if (!status || !role) {
    return false;
  }

  if (
    status === RequestStatus.AGUARDANDO_RESPOSTA &&
    role === Role.HOMOLOGADOR
  ) {
    return true;
  }

  const statusTransition = statusTransitions[status];

  if (!statusTransition) {
    return false;
  }

  return statusTransition.requiredRole === role;
}
