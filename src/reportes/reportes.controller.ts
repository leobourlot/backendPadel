import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesQueryDto } from './dto/reportes-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';

// Todos los endpoints quedan scoped al club actual (vía CurrentClub / middleware de subdominio)
// y solo son accesibles para ADMIN del club o SUPERADMIN (RolesGuard ya deja pasar siempre a SUPERADMIN).
@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    @Get('resumen')
    getResumen(@Query() query: ReportesQueryDto, @CurrentClub() club: Club) {
        return this.reportesService.getResumen(club.idClub, query.desde, query.hasta);
    }

    @Get('ocupacion')
    getOcupacion(@Query() query: ReportesQueryDto, @CurrentClub() club: Club) {
        return this.reportesService.getOcupacion(club.idClub, query.desde, query.hasta);
    }

    @Get('ingresos')
    getIngresos(@Query() query: ReportesQueryDto, @CurrentClub() club: Club) {
        return this.reportesService.getIngresos(club.idClub, query.desde, query.hasta);
    }

    @Get('horarios-pico')
    getHorariosPico(@Query() query: ReportesQueryDto, @CurrentClub() club: Club) {
        return this.reportesService.getHorariosPico(club.idClub, query.desde, query.hasta);
    }

    @Get('cancelaciones')
    getCancelaciones(@Query() query: ReportesQueryDto, @CurrentClub() club: Club) {
        return this.reportesService.getCancelaciones(club.idClub, query.desde, query.hasta);
    }
}