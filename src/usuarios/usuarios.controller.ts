import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
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
    update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.update(+id, updateUsuarioDto);
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