import IJwtPayload from 'src/auth/payloads/jwt-payload';
import { EUserRole } from 'src/common/enums';

export class DtoUserToken implements IJwtPayload {
  id: string;
  username: string;
  name: string;
  email: string;
  role: EUserRole;
}
