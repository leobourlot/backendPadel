import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Club } from '../clubes/entities/club.entity';
import { ReservasModule } from '../reservas/reservas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reserva, Club]),
        forwardRef(() => ReservasModule), // ✅ cambiado (antes era import directo)
    ],
    controllers: [PagosController],
    providers: [PagosService],
    exports: [PagosService],
})
export class PagosModule { }