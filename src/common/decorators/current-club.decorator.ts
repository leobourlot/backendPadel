import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Club } from '../../clubes/entities/club.entity';

// Uso en controllers: @CurrentClub() club: Club
export const CurrentClub = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): Club => {
        const request = ctx.switchToHttp().getRequest();
        return request.club;
    },
);