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
import { CanchasService } from './canchas.service';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('canchas')
export class CanchasController {
    constructor(private readonly canchasService: CanchasService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createCanchaDto: CreateCanchaDto) {
        return this.canchasService.create(createCanchaDto);
    }

    @Get()
    findAll() {
        return this.canchasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.canchasService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updateCanchaDto: UpdateCanchaDto) {
        return this.canchasService.update(+id, updateCanchaDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.canchasService.remove(+id);
    }
}