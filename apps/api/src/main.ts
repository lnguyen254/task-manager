import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/env';

async function bootstrap() {
  // Validated before the app is built so a missing/malformed env var fails
  // fast with a readable message instead of surfacing later as an obscure
  // runtime error the first time the bad value is used.
  const env = validateEnv();

  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      // Swagger UI at /api/docs relies on an inline bootstrap script;
      // Helmet's default CSP blocks it and breaks the docs page. Every
      // other Helmet protection (HSTS, frame-guard, etc.) stays on — this
      // is Nest's own documented workaround for the Swagger conflict.
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({ origin: env.CORS_ORIGIN, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription('Personal task and tag management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.PORT);
}
void bootstrap();
