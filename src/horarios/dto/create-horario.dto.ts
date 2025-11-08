import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateHorarioDto {
    @IsNotEmpty()
    @IsString()
    horaInicio: string;

    @IsNotEmpty()
    @IsString()
    horaFin: string;

    @IsOptional()
    @IsNumber()
    duracionMinutos?: number;
}