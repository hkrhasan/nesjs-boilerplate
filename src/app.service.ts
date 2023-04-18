import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    const ENV = this.config.get('NODE_ENV');

    return `Hello World! ENV: ${ENV}`;
  }
}
