import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { startOfDay, endOfDay } from 'date-fns';

export class PaginationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    limit: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    page: string;
}
