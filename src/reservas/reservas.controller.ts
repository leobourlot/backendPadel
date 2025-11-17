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
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReservaRecurrenteDto } from './dto/create-reserva-recurrente.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ReservasCronService } from './reservas-cron.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/usuarios/entities/usuario.entity';

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
    constructor(
        private readonly reservasService: ReservasService,
        private readonly cronService: ReservasCronService
    ) { }

    @Post()
    create(@Body() createReservaDto: CreateReservaDto, @CurrentUser() user: any) {
        return this.reservasService.create({
            ...createReservaDto,
            idUsuario: user.idUsuario,
        });
    }

    @Get()
    findAll() {
        return this.reservasService.findAll();
    }

    @Get('mis-reservas')
    findMyReservas(@CurrentUser() user: any) {
        return this.reservasService.findByUsuario(user.idUsuario);
    }

    @Get('cancha/:idCancha')
    findByCancha(
        @Param('idCancha') idCancha: string,
        @Query('fecha') fecha: string,
    ) {
        return this.reservasService.findByCancha(+idCancha, new Date(fecha));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reservasService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto) {
        return this.reservasService.update(+id, updateReservaDto);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.reservasService.cancel(+id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.reservasService.remove(+id);
    }

    // ✅ NUEVO: Crear reserva recurrente
    @Post('recurrente')
    createRecurrente(
        @Body() createDto: CreateReservaRecurrenteDto,
        @CurrentUser() user: any,
    ) {
        return this.reservasService.createRecurrente({
            ...createDto,
            idUsuario: user.idUsuario,
        });
    }

    // ✅ NUEVO: Listar mis reservas recurrentes
    @Get('recurrente/mis-reservas')
    findMyRecurrentes(@CurrentUser() user: any) {
        return this.reservasService.findRecurrentesByUsuario(user.idUsuario);
    }

    // ✅ NUEVO: Cancelar reserva recurrente
    @Delete('recurrente/:id')
    cancelRecurrente(@Param('id') id: string, @CurrentUser() user: any) {
        return this.reservasService.cancelRecurrente(+id, user.idUsuario);
    }

    // ✅ NUEVO: Endpoint manual para testing (solo admin)
    @Post('recurrente/regenerar')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    regenerarManualmente() {
        return this.cronService.regenerarManualmente();
    }
}