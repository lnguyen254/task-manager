import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TagsModule } from './tags/tags.module';

// Jest sets NODE_ENV=test for both unit and e2e runs. Rate limiting is
// wall-clock-based and shared across every test in a describe block (e2e
// specs build one app per file and reuse it across their it()s), so it's
// disabled under test rather than risking spurious 429s unrelated to what
// a test is actually checking.
const throttlerGuardProvider = [
  ...(process.env.NODE_ENV === 'test'
    ? []
    : [{ provide: APP_GUARD, useClass: ThrottlerGuard }]),
];

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        // Quiets the request-log spam that would otherwise drown out real
        // traffic in test output; the e2e suite already builds one app
        // instance per file and reuses it across many it()s.
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        // The Docker HEALTHCHECK polls this every 10s — logging it would
        // bury actual request activity in noise.
        autoLogging: {
          ignore: (req) => req.url === '/health',
        },
        // Tokens/passwords must never reach the logs (see CLAUDE.md's
        // security checklist): the access token travels as a Bearer header
        // between the BFF and this API, and the refresh/access tokens are
        // set as cookies by the BFF, so both header locations are redacted.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
          ],
          censor: '[Redacted]',
        },
      },
    }),
    TerminusModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    TasksModule,
    TagsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, ...throttlerGuardProvider],
})
export class AppModule {}
