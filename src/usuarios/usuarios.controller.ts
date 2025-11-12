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
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from './entities/usuario.entity';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Post()
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usuariosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usuariosService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.update(+id, updateUsuarioDto);
    }

    // ✅ NUEVO: Cambiar rol de un usuario (solo ADMIN)
    @Patch(':id/rol')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    updateRole(@Param('id') id: string, @Body('rol') rol: UserRole) {
        console.log(`🔄 Cambiando rol del usuario ${id} a ${rol}`);
        return this.usuariosService.updateRole(+id, rol);
    }

    // ✅ NUEVO: Activar/Desactivar usuario (solo ADMIN)
    @Patch(':id/estado')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    toggleActive(@Param('id') id: string, @Body('activo') activo: boolean) {
        console.log(`🔄 Cambiando estado del usuario ${id} a ${activo}`);
        return this.usuariosService.toggleActive(+id, activo);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usuariosService.remove(+id);
    }
}