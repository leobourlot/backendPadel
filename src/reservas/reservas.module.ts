import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';
import { CanchasModule } from '../canchas/canchas.module';
import { ReservaRecurrente } from './entities/reserva-recurrente.entity';
import { ReservasCronService } from './reservas-cron.service';

@Module({
    imports: [TypeOrmModule.forFeature([Reserva, ReservaRecurrente]), CanchasModule],
    controllers: [ReservasController],
    providers: [ReservasService, ReservasCronService],
    exports: [ReservasService],
})
export class ReservasModule { }