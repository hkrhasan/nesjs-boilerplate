import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidPhoneNumber } from 'src/utils';

export class PhoneAuthDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsValidPhoneNumber({
    countryCodes: ['IN', 'AE'],
    message: 'phone must be phone',
  })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralCode?: string;
}
