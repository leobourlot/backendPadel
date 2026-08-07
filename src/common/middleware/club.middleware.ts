import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClubesService } from '../../clubes/clubes.service';

@Injectable()
export class ClubMiddleware implements NestMiddleware {
    constructor(private readonly clubesService: ClubesService) { }

    async use(req: any, res: any, next: () => void) {
        if (req.method === 'OPTIONS') {
            return next();
        }

        const host: string = req.headers.host || '';
        const slugFromHeader = req.headers['x-club-slug'] as string;
        const slugFromHost = host.split('.')[0];
        const slugFinal = slugFromHeader || slugFromHost;

        const path: string = req.originalUrl || req.path || req.url || '';
        const pathOnly = path.split('?')[0]; // sacamos el query string para el matching

        // ✅ Matching PRECISO: solo las rutas de superadmin que operan sobre OTRO club (por :id),
        // o rutas que no requieren ningún club. NUNCA por prefijo amplio.
        const bypassExacto = ['/clubes', '/auth/superadmin/login', '/pagos/webhook'];
        const bypassRegex = [
            /^\/clubes\/con-admin$/,      // crear club + admin (superadmin)
            /^\/clubes\/\d+$/,            // GET/PATCH/DELETE /clubes/:id (superadmin)
            /^\/horarios-club\/\d+$/,     // GET/PUT /horarios-club/:idClub (superadmin)
        ];

        const esRutaPublica =
            bypassExacto.includes(pathOnly) ||
            bypassRegex.some((r) => r.test(pathOnly));

        // console.log('🔍 Path recibido:', pathOnly, '| Es ruta pública:', esRutaPublica); // dejalo un tiempo más para confirmar

        if (esRutaPublica) return next();

        // En desarrollo local sin header, usar club por defecto
        if (slugFinal === 'localhost' || slugFinal === '127') {
            const clubDev = await this.clubesService.findBySlug('slateblue-locust-897822');
            if (clubDev) {
                req['club'] = clubDev;
                return next();
            }
            return next();
        }

        try {
            const club = await this.clubesService.findBySlug(slugFinal);

            if (!club) {
                return res.status(404).json({
                    statusCode: 404,
                    message: 'Club no encontrado',
                });
            }

            if (!this.clubesService.isClubActivo(club)) {
                return res.status(403).json({
                    statusCode: 403,
                    message: 'El período de prueba ha vencido. Contacta a tu proveedor.',
                    vencido: true,
                });
            }

            req['club'] = club;
            next();
        } catch (error) {
            return res.status(500).json({
                statusCode: 500,
                message: 'Error al verificar el club',
            });
        }
    }
}