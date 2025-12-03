import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    bufferLogs: true,
    bodyParser: false, // Disable default body parser to use custom limits
    rawBody: false,
  });

  // Increase body size limit for file uploads (10MB for base64 images)
  app.use(require('body-parser').json({ limit: '10mb' }));
  app.use(require('body-parser').urlencoded({ limit: '10mb', extended: true }));

  // Security
  app.use(helmet());

  // Enable response compression
  app.use(compression({
    threshold: 1024,
    level: 6,
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Production-ready authentication service for real estate application')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Users')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Auth Service running on http://localhost:${port}`);
}
bootstrap();
