import { IsNotEmpty, IsNumber, IsDateString, IsString } from 'class-validator';

export class CreateReservaDto {
    @IsNumber()
    @IsNotEmpty()
    idCancha: number;

    @IsDateString()
    @IsNotEmpty()
    fechaReserva: Date;

    @IsString()
    @IsNotEmpty()
    horaInicio: string;

    @IsString()
    @IsNotEmpty()
    horaFin: string;

    idUsuario?: number; // Se asigna automáticamente desde el token JWT
}