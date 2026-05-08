import { SetMetadata } from '@nestjs/common';
import { EUserRole } from 'src/common/enums';

export const AllowPermission = (role: EUserRole[]) => {
  return SetMetadata('permissions', role);
};
