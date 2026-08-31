import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isHttpException = exception instanceof HttpException;
        const status = isHttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = isHttpException
            ? exception.getResponse()
            : null;

        const message = isHttpException
            ? (typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any)?.message || 'Error inesperado')
            : 'Error interno del servidor';

        // Log completo para nosotros (con stack trace si es un error real)
        const club = (request as any)['club'];
        const contexto = {
            method: request.method,
            path: request.originalUrl,
            club: club?.slug || 'sin-club',
            status,
        };

        if (status >= 500) {
            this.logger.error(
                `${JSON.stringify(contexto)} - ${(exception as Error)?.message}`,
                (exception as Error)?.stack,
            );
        } else {
            this.logger.warn(`${JSON.stringify(contexto)} - ${message}`);
        }

        // Respuesta al cliente: nunca exponemos el stack trace ni detalles internos
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
        });
    }
}