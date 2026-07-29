import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ForbiddenException
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from './entities/usuario.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post()
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    // Solo admins del club ven su lista de usuarios
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll(@CurrentClub() club: Club) {
        return this.usuariosService.findAll(club.idClub);
    }

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

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usuariosService.remove(+id);
    }
}