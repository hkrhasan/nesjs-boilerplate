import { Global, Module } from '@nestjs/common';
import { SMSService } from './sms.service';
import { SMSController } from './sms.controller';

@Global()
@Module({
  providers: [SMSService],
  exports: [SMSService],
  controllers: [SMSController],
})
export class SMSModule {}
