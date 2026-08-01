import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { HorariosClubService } from './horarios-club.service';
import { UpdateHorariosClubDto } from './dto/update-horarios-club.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';

@Controller('horarios-club')
export class HorariosClubController {
    constructor(private readonly horariosClubService: HorariosClubService) { }

    // Pública: usada por el frontend para generar los horarios disponibles del club actual
    @Get()
    findActual(@CurrentClub() club: Club) {
        return this.horariosClubService.findByClub(club.idClub);
    }

    // Solo superadmin: para editar los horarios de cualquier club desde el panel
    @Get(':idClub')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    findByClub(@Param('idClub') idClub: string) {
        return this.horariosClubService.findByClub(+idClub);
    }

    @Put(':idClub')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    update(@Param('idClub') idClub: string, @Body() dto: UpdateHorariosClubDto) {
        return this.horariosClubService.upsertHorarios(+idClub, dto);
    }
}