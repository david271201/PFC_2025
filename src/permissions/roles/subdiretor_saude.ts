import { Permission } from '../permissions';

const permissionsArray: Permission[] = [
  'files:download',
  'organizations:read',
  'requests:create',
  'requests:read',
  'requests:update',
  'stats:read',
  'pacients:create',
  'pacients:read',
  'pacients:update',
  'pacients:delete',
];

const permissions = new Set(permissionsArray);

export default permissions;
