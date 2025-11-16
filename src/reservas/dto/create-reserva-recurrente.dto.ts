import { IsNotEmpty, IsNumber, IsEnum, IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { DiaSemana } from '../entities/reserva-recurrente.entity';

export class CreateReservaRecurrenteDto {
    @IsNumber()
    @IsNotEmpty()
    idCancha: number;

    @IsEnum(DiaSemana)
    @IsNotEmpty()
    diaSemana: DiaSemana;

    @IsString()
    @IsNotEmpty()
    horaInicio: string;

    @IsString()
    @IsNotEmpty()
    horaFin: string;

    @IsDateString()
    @IsNotEmpty()
    fechaInicio: Date;

    @IsDateString()
    @IsOptional()
    fechaFin?: Date;

    idUsuario?: number; // Se asigna del token
}