import { IsArray, IsBoolean, IsEnum, IsInt, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DiaSemana } from '../entities/horario-club.entity';

class HorarioDiaDto {
    @IsEnum(DiaSemana)
    diaSemana: DiaSemana;

    @IsString()
    horaInicio: string;

    @IsString()
    horaFin: string;

    @IsInt()
    @Min(15)
    duracionTurno: number;

    @IsBoolean()
    activo: boolean;
}

export class UpdateHorariosClubDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HorarioDiaDto)
    horarios: HorarioDiaDto[];
}