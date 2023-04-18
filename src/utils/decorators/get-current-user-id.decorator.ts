import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../../auth/types';
import { PrismaClient } from '@prisma/client';
import { CustomForbiddenException } from '../exceptions';

const prisma = new PrismaClient();

export const GetCurrentUserId = createParamDecorator(
  async (_: undefined, context: ExecutionContext): Promise<number> => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    const isExist = await prisma.user.findUnique({
      where: {
        id: user.sub,
      },
    });

    if (!isExist) {
      throw new CustomForbiddenException('Invalid token');
    }

    return user.sub;
  },
);
