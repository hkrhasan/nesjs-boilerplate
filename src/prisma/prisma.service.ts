// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import Hashids from 'hashids';

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly hashids: Hashids;
  [x: string]: any;
  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');
    super({
      datasources: {
        db: {
          url,
        },
      },
    });
    // Initialize the Hashids instance with a custom alphabet
    const customAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

    this.hashids = new Hashids(
      config.get<string>('AT_SECRET'),
      6,
      customAlphabet,
    );

    this.$use(async (params, next) => {
      const result = await next(params);

      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
