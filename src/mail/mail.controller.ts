import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SendEmailDto } from './dto';
import { MailService } from './mail.service';
import { UserRole } from '@prisma/client';
import { FormatResponseInterceptor, Roles } from 'src/utils';

@ApiBearerAuth()
@ApiTags('mail')
@UseInterceptors(FormatResponseInterceptor)
@Controller({
  version: '1',
  path: 'mail',
})
export class MailController {
  constructor(private readonly service: MailService) {}

  @Post('send')
  @Roles(UserRole.ADMIN)
  async sendEmail(@Body() dto: SendEmailDto) {
    return await this.service.sendEmail(
      dto.email,
      undefined,
      dto.context,
      dto.message,
      dto.subject,
    );
  }
}
