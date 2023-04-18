import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSMSTemplate {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    template: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}
