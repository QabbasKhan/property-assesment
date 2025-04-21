import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnyExceptionFilter } from './common/filters/exception.filter';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { ConfigModule } from './config/config.module';
import { CmsModule } from './modules/cms/cms.module';

import { SocketsModule } from './modules/sockets/sockets.module';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './shared/shared.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.register({ folder: './env' }),
    CmsModule,
    UsersModule,
    SocketsModule,
    SharedModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AnyExceptionFilter },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
