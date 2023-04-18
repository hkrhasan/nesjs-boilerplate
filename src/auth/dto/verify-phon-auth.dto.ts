import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidPhoneNumber } from 'src/utils';

export class VerifyPhoneAuthDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsValidPhoneNumber({
    countryCodes: ['IN', 'AE'],
    message: 'phone must be phone',
  })
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  otp: string;
}
