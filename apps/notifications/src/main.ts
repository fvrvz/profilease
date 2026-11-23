import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('NotificationBootstrap');
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for frontend and SSR integration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
  });

  // Enterprise RabbitMQ Microservice connection if configured
  const rabbitMqUrl = process.env['RABBITMQ_URL'];
  if (rabbitMqUrl) {
    try {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitMqUrl],
          queue: 'profilease_notifications_queue',
          queueOptions: {
            durable: true
          }
        }
      });
      await app.startAllMicroservices();
      logger.log(`🐇 RabbitMQ microservice connected to: ${rabbitMqUrl}`);
    } catch (err) {
      logger.warn(`Could not connect to RabbitMQ broker: ${(err as Error).message}`);
    }
  } else {
    logger.log('ℹ️ RABBITMQ_URL not set; running in HTTP/REST event mode on port 3333');
  }

  const port = process.env['NOTIFICATION_PORT'] || process.env['PORT'] || 3333;
  await app.listen(port);

  // Set when Nx waits for this server to be ready
  if (process.env['NX_READY_SIGNAL_SOCKET']) {
    try {
      const load = new Function('s', 'return import(s)') as (s: string) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // @nx/js isn't installed
    }
  }

  logger.log(`🚀 Profilease Notification Service running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
