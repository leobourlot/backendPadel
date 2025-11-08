import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';
import { CanchasModule } from '../canchas/canchas.module';

@Module({
    imports: [TypeOrmModule.forFeature([Reserva]), CanchasModule],
    controllers: [ReservasController],
    providers: [ReservasService],
    exports: [ReservasService],
})
export class ReservasModule { }