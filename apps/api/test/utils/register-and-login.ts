import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function registerAndLogin(app: INestApplication) {
  const email = `${randomUUID()}@example.com`;
  const password = 'correct-horse-battery-staple';

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password, name: 'Test User' })
    .expect(201);

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return { accessToken: response.body.accessToken as string, email };
}
