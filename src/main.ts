import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir todos los subdominios de turnos.bourderweb.com.ar
      const allowedPatterns = [
        /^https?:\/\/.*\.turnos\.bourderweb\.com\.ar$/,
        /^https?:\/\/turnos\.bourderweb\.com\.ar$/,
        /^http:\/\/localhost:\d+$/,  // desarrollo local
      ];

      if (!origin || allowedPatterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 4000, '0.0.0.0');
  console.log(`Application running on: ${await app.getUrl()}`);
}
bootstrap();