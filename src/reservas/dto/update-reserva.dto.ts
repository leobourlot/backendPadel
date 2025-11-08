import { PartialType } from '@nestjs/mapped-types';
import { CreateReservaDto } from './create-reserva.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateReservaDto extends PartialType(CreateReservaDto) {
    @IsOptional()
    @IsString()
    estado?: string;
}