import { Permission } from '../permissions';

const permissionsArray: Permission[] = [
  'files:download',
  'requests:create',
  'requests:read',
  'requests:update',
];

const permissions = new Set(permissionsArray);

export default permissions;
