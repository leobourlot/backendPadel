import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorariosClubController } from './horarios-club.controller';
import { HorariosClubService } from './horarios-club.service';
import { HorarioClub } from './entities/horario-club.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HorarioClub])],
    controllers: [HorariosClubController],
    providers: [HorariosClubService],
    exports: [HorariosClubService],
})
export class HorariosClubModule { }