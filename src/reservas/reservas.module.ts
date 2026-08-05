import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';
import { CanchasModule } from '../canchas/canchas.module';
import { ReservaRecurrente } from './entities/reserva-recurrente.entity';
import { ReservasCronService } from './reservas-cron.service';
import { PagosModule } from '../pagos/pagos.module'; // ✅ NUEVO

@Module({
    imports: [
        TypeOrmModule.forFeature([Reserva, ReservaRecurrente]),
        CanchasModule,
        forwardRef(() => PagosModule), // ✅ NUEVO
    ],
    controllers: [ReservasController],
    providers: [ReservasService, ReservasCronService],
    exports: [ReservasService],
})
export class ReservasModule { }