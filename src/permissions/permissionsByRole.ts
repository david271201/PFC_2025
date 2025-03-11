import { Role } from '@prisma/client';
import { Permission, permissions } from './permissions';
import operadorFusexPermissions from './roles/operador_fusex';
import chefeFusexPermissions from './roles/chefe_fusex';
import auditorPermissions from './roles/auditor';
import chefeAuditoriaPermissions from './roles/chefe_auditoria';
import especialistaPermissions from './roles/especialista';
import chefeDivMedicinaPermissions from './roles/chefe_div_medicina';
import cotadorPermissions from './roles/cotador';
import homologadorPermissions from './roles/homologador';
import chemPermissions from './roles/chem';
import chefeSecaoRegionalPermissions from './roles/chefe_secao_regional';
import operadorSecaoRegionalPermissions from './roles/operador_secao_regional';
import drasPermissions from './roles/dras';
import subdiretorSaudePermissions from './roles/subdiretor_saude';

const permissionsByRole: Record<Role, Set<Permission>> = {
  [Role.SUPERADMIN]: new Set(permissions),
  [Role.OPERADOR_FUSEX]: operadorFusexPermissions,
  [Role.CHEFE_FUSEX]: chefeFusexPermissions,
  [Role.AUDITOR]: auditorPermissions,
  [Role.CHEFE_AUDITORIA]: chefeAuditoriaPermissions,
  [Role.ESPECIALISTA]: especialistaPermissions,
  [Role.CHEFE_DIV_MEDICINA]: chefeDivMedicinaPermissions,
  [Role.COTADOR]: cotadorPermissions,
  [Role.HOMOLOGADOR]: homologadorPermissions,
  [Role.CHEM]: chemPermissions,
  [Role.CHEFE_SECAO_REGIONAL]: chefeSecaoRegionalPermissions,
  [Role.OPERADOR_SECAO_REGIONAL]: operadorSecaoRegionalPermissions,
  [Role.DRAS]: drasPermissions,
  [Role.SUBDIRETOR_SAUDE]: subdiretorSaudePermissions,
};

export default permissionsByRole;
