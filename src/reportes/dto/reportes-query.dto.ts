import { IsOptional, IsDateString } from 'class-validator';

export class ReportesQueryDto {
    // Formato esperado: YYYY-MM-DD
    @IsOptional()
    @IsDateString()
    desde?: string;

    @IsOptional()
    @IsDateString()
    hasta?: string;
}