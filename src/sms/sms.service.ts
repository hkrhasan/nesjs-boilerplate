import { ForbiddenException, Injectable } from '@nestjs/common';
import { SMSTransport } from './sms.transport';
import { ConfigService } from '@nestjs/config';
import { CreateSMSTemplate } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomForbiddenException } from 'src/utils';

@Injectable()
export class SMSService {
  private smsTransport: SMSTransport;

  messages = {
    entityCreated: 'Your account is successfully connected with mighty pay',
  };

  constructor(
    private config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const options = {
      accountSid: config.get('TWILIO_ACCOUNT_SID'),
      authToken: config.get('TWILIO_AUTH_TOKEN'),
      verifyServiceId: config.get('TWILIO_VERIFY_SERVICE_SID'),
      smsServiceId: config.get('TWILIO_MSG_SERVICE_SID'),
    };
    this.smsTransport = new SMSTransport('twilio', options);
  }

  async phoneVerify(phone: string) {
    return await this.smsTransport.twilioPhoneVerify(phone);
  }

  async otpCheck(phone: string, otp: string) {
    try {
      const resp = await this.smsTransport.twilioOtpVerification(phone, otp);
      return resp;
    } catch (error) {
      console.log({ error });
      throw new CustomForbiddenException('Invalid Phone!');
    }
  }

  async sendMessage(phone: string, message: string, data: object = {}) {
    try {
      let body = this.messages[message] || message;
      body = this.formatMessage(body, data);
      return await this.smsTransport.twilioMessageSend(phone, body);
    } catch (error) {
      console.error(error);
      throw new CustomForbiddenException(
        'something went wrong in sendMessage function',
      );
    }
  }

  formatMessage(template: string, data: object) {
    return template.replace(/{{(\w+)}}/g, (match, variable) => {
      return data[variable] || '';
    });
  }

  async createSMSTemplate(dto: CreateSMSTemplate) {
    try {
      return await this.prisma.sMSTemplate.create({
        data: {
          template: dto.template,
          isActive: dto.isActive,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(`===================================`);
        console.log(`DATABASE ERROR => ${error.code}`);
        console.log(`DATABASE MESSAGE => ${error.message}`);
        console.log(`===================================`);
        throw new CustomForbiddenException(
          `something went wrong on creating sms template`,
        );
      }
      throw error;
    }
  }
}
