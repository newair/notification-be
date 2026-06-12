import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Notification API')
    .setDescription(
      'Push notification service - register FCM device tokens and send push notifications to end users of a given app (scoped by appId)',
    )
    .setVersion('1.0')
    .addTag('notifications', 'Device token registration and push delivery')
    .addServer('http://localhost:3001', 'Local development server')
    .addServer('https://your-production-url.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputDir = './docs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonPath = path.join(outputDir, 'swagger-spec.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
  console.log(`✅ Swagger JSON file generated: ${jsonPath}`);

  await app.close();

  console.log('🎉 Swagger documentation files generated successfully!');
  console.log(`📁 Files saved in: ${path.resolve(outputDir)}`);
}

generateSwagger().catch((error) => {
  console.error('❌ Error generating Swagger documentation:', error);
  process.exit(1);
});
