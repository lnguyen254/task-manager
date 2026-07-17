import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { registerAndLogin } from './utils/register-and-login';

describe('Tags (e2e)', () => {
  let app: INestApplication<App>;
  let userAToken: string;
  let userBToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userAToken = (await registerAndLogin(app)).accessToken;
    userBToken = (await registerAndLogin(app)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a valid access token', async () => {
    await request(app.getHttpServer()).get('/tags').expect(401);
  });

  describe('full CRUD lifecycle', () => {
    let tagId: string;

    it('creates a tag', async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Groceries' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'Groceries' });
      tagId = res.body.id;
    });

    it('lists the created tag', async () => {
      const res = await request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.some((t: { id: string }) => t.id === tagId)).toBe(true);
    });

    it('rejects a duplicate tag name for the same user with a clear conflict error', async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Groceries' })
        .expect(409);

      expect(res.body.message).toMatch(/already exists/i);
    });

    it('deletes the tag', async () => {
      await request(app.getHttpServer())
        .delete(`/tags/${tagId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(204);
    });

    it('no longer lists the deleted tag', async () => {
      const res = await request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.some((t: { id: string }) => t.id === tagId)).toBe(
        false,
      );
    });
  });

  describe('cross-user access denial', () => {
    let userATagId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: "User A's tag" })
        .expect(201);
      userATagId = res.body.id;
    });

    it("does not include user A's tag in user B's list", async () => {
      const res = await request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(
        res.body.some((t: { id: string }) => t.id === userATagId),
      ).toBe(false);
    });

    it("returns 404 when user B deletes user A's tag, and the tag still exists", async () => {
      await request(app.getHttpServer())
        .delete(`/tags/${userATagId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(404);

      const res = await request(app.getHttpServer())
        .get('/tags')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);
      expect(
        res.body.some((t: { id: string }) => t.id === userATagId),
      ).toBe(true);
    });

    it('lets user B create a tag with the same name as user A (uniqueness is per-user)', async () => {
      await request(app.getHttpServer())
        .post('/tags')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: "User A's tag" })
        .expect(201);
    });
  });
});
