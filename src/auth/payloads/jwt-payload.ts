import { EUserRole } from 'src/common/enums';

export default interface IJwtPayload {
  id: string;
  username: string;
  name: string;
  email: string;
  role: EUserRole;
}
