import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SMSService } from './sms.service';
import { CreateSMSTemplate, SendSMSDto } from './dto';
import { UserRole } from '@prisma/client';
import { FormatResponseInterceptor, Roles } from 'src/utils';

@ApiBearerAuth()
@ApiTags('sms')
@UseInterceptors(FormatResponseInterceptor)
@Controller({
  version: '1',
  path: 'sms',
})
export class SMSController {
  constructor(private readonly service: SMSService) {}

  @Post('sms-template')
  @Roles(UserRole.ADMIN)
  async createSMSTemplate(@Body() dto: CreateSMSTemplate) {
    return this.service.createSMSTemplate(dto);
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  async send(@Body() dto: SendSMSDto) {
    return this.service.sendMessage(dto.phone, dto.message, dto.context);
  }
}
