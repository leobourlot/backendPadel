import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // origin: 'http://localhost:3001', // URL de tu frontend React
    origin: ['http://localhost:3001', 'https://slateblue-locust-897822.hostingersite.com', 'https://lightyellow-echidna-660344.hostingersite.com'],
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