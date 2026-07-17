import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { registerAndLogin } from './utils/register-and-login';

describe('Tasks (e2e)', () => {
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
    await request(app.getHttpServer()).get('/tasks').expect(401);
  });

  describe('full CRUD lifecycle', () => {
    let taskId: string;

    it('creates a task', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Buy milk', priority: 'HIGH' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'Buy milk',
        priority: 'HIGH',
        status: 'TODO',
        tags: [],
      });
      taskId = res.body.id;
    });

    it('lists the created task', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.some((t: { id: string }) => t.id === taskId)).toBe(
        true,
      );
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('gets the task by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.id).toBe(taskId);
    });

    it('updates the task', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'DONE' })
        .expect(200);

      expect(res.body.status).toBe('DONE');
    });

    it('deletes the task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(204);
    });

    it('returns 404 for the task after it has been deleted', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);
    });
  });

  describe('cross-user access denial', () => {
    let userATaskId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: "User A's private task" })
        .expect(201);
      userATaskId = res.body.id;
    });

    it("returns 404 (not 200) when user B reads user A's task", async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(404);
    });

    it("returns 404 when user B updates user A's task, and the task is unchanged", async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'hijacked' })
        .expect(404);

      const res = await request(app.getHttpServer())
        .get(`/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);
      expect(res.body.title).toBe("User A's private task");
    });

    it("returns 404 when user B deletes user A's task, and the task still exists", async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);
    });

    it("does not include user A's task in user B's list", async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(
        res.body.data.some((t: { id: string }) => t.id === userATaskId),
      ).toBe(false);
    });
  });
});
