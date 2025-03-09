import { Permission } from '../permissions';

const permissionsArray: Permission[] = [
  'files:download',
  'organizations:read',
  'pacients:read',
  'requests:create',
  'requests:read',
  'requests:update',
];

const permissions = new Set(permissionsArray);

export default permissions;
