import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    bufferLogs: true,
  });

  // Increase payload size limit for image uploads (50MB)
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable response compression
  app.use(compression({
    threshold: 1024,
    level: 6,
  }));

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3002);
  console.log('🚀 Property Service running on http://localhost:3002');
}
bootstrap();
