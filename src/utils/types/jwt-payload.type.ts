import { UserRole } from '@prisma/client';

export type JwtPayloadType = {
  identification: string;
  sub: number;
  role: UserRole;
};
