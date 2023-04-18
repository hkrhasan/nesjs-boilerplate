import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsPhoneNumber,
    IsString,
} from 'class-validator';

export class SendEmailDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    message: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    subject: string;

    @ApiProperty()
    @IsOptional()
    @IsObject()
    context: object;
}
