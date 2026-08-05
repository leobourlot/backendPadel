import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { CreateReservaRecurrenteDto } from './dto/create-reserva-recurrente.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { ReservasCronService } from './reservas-cron.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { Club } from '../clubes/entities/club.entity';
import { PagosService } from '../pagos/pagos.service'; // ✅ NUEVO

@Controller('reservas')
export class ReservasController {
    constructor(
        private readonly reservasService: ReservasService,
        private readonly cronService: ReservasCronService,
        @Inject(forwardRef(() => PagosService)) // ✅ NUEVO
        private readonly pagosService: PagosService, // ✅ NUEVO
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Body() createReservaDto: CreateReservaDto,
        @CurrentUser() user: any,
        @CurrentClub() club: Club,
    ) {
        return this.reservasService.create(
            { ...createReservaDto, idUsuario: user.idUsuario },
            club.idClub,
        );
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@CurrentClub() club: Club) {
        return this.reservasService.findAll(club.idClub);
    }

    @Get('mis-reservas')
    @UseGuards(JwtAuthGuard)
    findMyReservas(@CurrentUser() user: any, @CurrentClub() club: Club) {
        return this.reservasService.findByUsuario(user.idUsuario, club.idClub);
    }

    @Get('cancha/:idCancha')
    findByCancha(
        @Param('idCancha') idCancha: string,
        @Query('fecha') fecha: string,
        @CurrentClub() club: Club,
    ) {
        return this.reservasService.findByCancha(+idCancha, new Date(fecha), club.idClub);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string, @CurrentClub() club: Club) {
        return this.reservasService.findOne(+id, club.idClub);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id') id: string,
        @Body() updateReservaDto: UpdateReservaDto,
        @CurrentClub() club: Club,
    ) {
        return this.reservasService.update(+id, updateReservaDto, club.idClub);
    }

    // ✅ CAMBIADO: ahora usa PagosService para aplicar la política de devolución/seña
    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard)
    cancel(@Param('id') id: string, @CurrentClub() club: Club) {
        return this.pagosService.cancelarConPolitica(+id, club.idClub);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @CurrentClub() club: Club) {
        return this.reservasService.remove(+id, club.idClub);
    }

    @Post('recurrente')
    @UseGuards(JwtAuthGuard)
    createRecurrente(
        @Body() createDto: CreateReservaRecurrenteDto,
        @CurrentUser() user: any,
        @CurrentClub() club: Club,
    ) {
        return this.reservasService.createRecurrente(
            { ...createDto, idUsuario: user.idUsuario },
            club.idClub,
        );
    }

    @Get('recurrente/mis-reservas')
    @UseGuards(JwtAuthGuard)
    findMyRecurrentes(@CurrentUser() user: any, @CurrentClub() club: Club) {
        return this.reservasService.findRecurrentesByUsuario(user.idUsuario, club.idClub);
    }

    @Delete('recurrente/:id')
    @UseGuards(JwtAuthGuard)
    cancelRecurrente(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @CurrentClub() club: Club,
    ) {
        return this.reservasService.cancelRecurrente(+id, user.idUsuario, club.idClub);
    }

    @Post('recurrente/regenerar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    regenerarManualmente() {
        return this.cronService.regenerarManualmente();
    }
}