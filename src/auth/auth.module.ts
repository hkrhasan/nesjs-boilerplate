import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy, RtStrategy } from './strategies';
import { SMSModule } from '../sms/sms.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [JwtModule.register({}), SMSModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
