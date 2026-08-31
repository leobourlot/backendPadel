import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Cancha } from '../canchas/entities/cancha.entity';
import { HorarioClub } from '../horarios-club/entities/horario-club.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Reserva, Cancha, HorarioClub])],
    controllers: [ReportesController],
    providers: [ReportesService],
})
export class ReportesModule { }