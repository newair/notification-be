import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Optional routing prefix so the service can be mounted behind a shared gateway
  // at paths like `/notification`, while keeping internal routes like `/api`, etc.
  const prefix = process.env.SERVICE_PREFIX;
  if (prefix) {
    app.setGlobalPrefix(prefix);
  }

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3001;
  const publicApiUrl = process.env.PUBLIC_API_URL?.trim();

  // Swagger configuration
  const builder = new DocumentBuilder()
    .setTitle('Notification API')
    .setDescription(
      'Push notification service - register FCM device tokens and send push notifications to end users of a given app (scoped by appId)',
    )
    .setVersion('1.0')
    .addTag('notifications', 'Device token registration and push delivery');

  if (publicApiUrl) {
    builder.addServer(publicApiUrl, 'Public API gateway');
  }
  builder.addServer(`http://localhost:${port}`, 'Local development server');

  const config = builder.build();

  const document = SwaggerModule.createDocument(app, config);

  // Generate Swagger JSON file (docs only)
  const outputPath = path.resolve(process.cwd(), 'docs', 'swagger-spec.json');
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), {
    encoding: 'utf8',
  });
  console.log(`📄 Swagger JSON file generated: ${outputPath}`);

  // Mount Swagger under the same prefix as the rest of the API.
  const swaggerBasePath = prefix ? `${prefix}/api` : 'api';
  SwaggerModule.setup(swaggerBasePath, app, document, {
    customSiteTitle: 'Notification API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger documentation: http://localhost:${port}${prefix ? `/${prefix}` : ''}/api`,
  );
  console.log(
    `📄 Swagger JSON available at: http://localhost:${port}${prefix ? `/${prefix}` : ''}/api-json`,
  );
}
bootstrap();
