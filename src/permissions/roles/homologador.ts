import { Permission } from '../permissions';

const permissionsArray: Permission[] = [
  'files:download',
  'requests:create',
  'requests:read',
  'requests:update',
  'requests:delete',
  'responses:select',
];

const permissions = new Set(permissionsArray);

export default permissions;
