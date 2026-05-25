import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubesController } from './clubes.controller';
import { ClubesService } from './clubes.service';
import { Club } from './entities/club.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Club])],
    controllers: [ClubesController],
    providers: [ClubesService],
    exports: [ClubesService],
})
export class ClubsModule { }