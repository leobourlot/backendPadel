import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ForbiddenException,
    ConflictException,
    Query,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateUsuarioSuperAdminDto } from './dto/update-usuario-superadmin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from './entities/usuario.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import * as bcrypt from 'bcryptjs';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    // ✅ CAMBIADO: antes cualquier usuario autenticado (incluso un jugador) podía
    // crear usuarios de cualquier club/rol. Ahora requiere ser admin del club o superadmin.
    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    // Solo admins del club ven su lista de usuarios (scoped por subdominio)
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll(@CurrentClub() club: Club) {
        return this.usuariosService.findAll(club.idClub);
    }

    // ============================================================
    // ✅ NUEVO: rutas exclusivas del panel de superadmin.
    // Operan sobre TODOS los clubes y no dependen del subdominio
    // (bypasseadas en ClubMiddleware).
    // ============================================================

    @Get('superadmin/todos')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    findAllSuperAdmin(@Query('idClub') idClub?: string) {
        return this.usuariosService.findAllGlobal(idClub ? +idClub : undefined);
    }

    @Post('superadmin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    async createSuperAdmin(@Body() dto: CreateUsuarioDto) {
        try {
            const hashedPassword = await bcrypt.hash(dto.clave, 10);
            return await this.usuariosService.create({ ...dto, clave: hashedPassword });
        } catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('El DNI o email ya está en uso en ese club');
            }
            throw error;
        }
    }

    @Patch('superadmin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    updateSuperAdmin(@Param('id') id: string, @Body() dto: UpdateUsuarioSuperAdminDto) {
        return this.usuariosService.update(+id, dto, undefined, true);
    }

    @Delete('superadmin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    removeSuperAdmin(@Param('id') id: string) {
        return this.usuariosService.remove(+id, undefined, true);
    }

    // ============================================================

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usuariosService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
        @CurrentUser() currentUser: any,
        @CurrentClub() club: Club,
    ) {
        const targetId = +id;
        const esPropio = currentUser.idUsuario === targetId;
        const esAdmin = currentUser.rol === UserRole.ADMIN;
        const esSuperAdmin = currentUser.rol === UserRole.SUPERADMIN;

        if (!esPropio && !esAdmin && !esSuperAdmin) {
            throw new ForbiddenException('No tenés permiso para editar este usuario');
        }

        return this.usuariosService.update(targetId, updateUsuarioDto, club.idClub, esSuperAdmin);
    }

    @Patch(':id/rol')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    updateRole(@Param('id') id: string, @Body('rol') rol: UserRole) {
        return this.usuariosService.updateRole(+id, rol);
    }

    @Patch(':id/estado')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    toggleActive(@Param('id') id: string, @Body('activo') activo: boolean) {
        return this.usuariosService.toggleActive(+id, activo);
    }

    // ✅ CAMBIADO: antes cualquier usuario autenticado podía borrar cualquier usuario.
    // Ahora requiere ser admin (scoped a su propio club) o superadmin.
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(
        @Param('id') id: string,
        @CurrentUser() currentUser: any,
        @CurrentClub() club: Club,
    ) {
        const esSuperAdmin = currentUser.rol === UserRole.SUPERADMIN;
        return this.usuariosService.remove(+id, club.idClub, esSuperAdmin);
    }
}