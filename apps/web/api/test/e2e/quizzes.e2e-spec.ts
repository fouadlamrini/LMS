import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Types } from 'mongoose';
import { applyGlobalSetup } from './setup';
import { QuizStatus } from 'src/enums/quiz.enum';
import { AppModule } from 'src/app.module';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Role } from 'src/roles/role.enum';

describe('Quizzes (e2e)', () => {
  let app: INestApplication;

  // We make this an object we can modify inside tests to test different roles
  const currentUser = {
    userId: new Types.ObjectId().toString(),
    role: Role.ADMIN as string,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { ...currentUser }; // Use a copy of our dynamic mock
          return true;
        },
      })
      // We use the real RolesGuard logic but mock the context
      .compile();

    app = moduleFixture.createNestApplication();
    applyGlobalSetup(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/quizzes', () => {
    it('SUCCESS: should create a quiz for a valid moduleId', async () => {
      const validModuleId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId: validModuleId })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.moduleId).toBeDefined();
    });

    it('FAIL: should return 400 if moduleId is missing (ValidationPipe)', async () => {
      return request(app.getHttpServer())
        .post('/api/quizzes')
        .send({}) // Missing required field
        .expect(400);
    });

    it('FAIL: should return 400 if extra fields are sent (forbidNonWhitelisted)', async () => {
      return request(app.getHttpServer())
        .post('/api/quizzes')
        .send({
          moduleId: new Types.ObjectId().toString(),
          unknownField: 'hack',
        })
        .expect(400);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    let createdQuizId: string;

    beforeAll(async () => {
      // Create a quiz to test retrieval
      const res = await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId: new Types.ObjectId().toString() });
      createdQuizId = res.body._id;
    });

    it('SUCCESS: should return the quiz when a valid ID is provided', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/quizzes/${createdQuizId}`)
        .expect(200);

      expect(response.body._id).toBe(createdQuizId);
    });

    it('FAIL: should return 404 for a non-existent ID', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      return request(app.getHttpServer())
        .get(`/api/quizzes/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /api/quizzes/learner/my-quizzes', () => {
    it('SUCCESS: should return quizzes for LEARNER role', async () => {
      currentUser.role = Role.LEARNER; // Switch mock to Learner

      const response = await request(app.getHttpServer())
        .get('/api/quizzes/learner/my-quizzes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    // NOTE: If you use .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
    // this "FAIL" test won't work. To test this, ensure you are NOT overriding RolesGuard
    // OR you are overriding it with logic that checks req.user.role.
  });

  describe('PATCH /api/quizzes/:quizId/status', () => {
    let quizId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId: new Types.ObjectId().toString() });
      quizId = res.body._id;
    });

    it('SUCCESS: should update status to PUBLISHED', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/quizzes/${quizId}/status`)
        .send({ status: QuizStatus.PUBLISHED })
        .expect(200);

      expect(response.body.status).toBe(QuizStatus.PUBLISHED);
    });

    it('FAIL: should return 400 for invalid status string', async () => {
      return request(app.getHttpServer())
        .patch(`/api/quizzes/${quizId}/status`)
        .send({ status: 'NOT_A_VALID_STATUS' })
        .expect(400);
    });
  });

  describe('GET /api/quizzes/:id/default-passing-score', () => {
    let quizId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId: new Types.ObjectId().toString() });
      quizId = res.body._id;
    });

    it('SUCCESS: should return calculated passing score', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/quizzes/${quizId}/default-passing-score`)
        .expect(200);

      expect(response.body).toHaveProperty('defaultPassingScore');
      expect(typeof response.body.defaultPassingScore).toBe('number');
    });

    it('FAIL: should return 404 for non-existent quiz', async () => {
      const fakeId = new Types.ObjectId().toString();
      return request(app.getHttpServer())
        .get(`/api/quizzes/${fakeId}/default-passing-score`)
        .expect(404);
    });
  });

  describe('GET /api/quizzes/module/:moduleId', () => {
    let moduleId: string;

    beforeAll(async () => {
      moduleId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId });
    });

    it('SUCCESS: should find a quiz by its module ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/quizzes/module/${moduleId}`)
        .expect(200);

      expect(response.body.moduleId).toBeDefined();
    });

    it('FAIL: should return 404 if module has no quiz', async () => {
      const fakeModuleId = new Types.ObjectId().toString();
      return request(app.getHttpServer())
        .get(`/api/quizzes/module/${fakeModuleId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/quizzes/:id', () => {
    let quizId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId: new Types.ObjectId().toString() });
      quizId = res.body._id;
    });

    it('SUCCESS: should update the passing score to a valid value', async () => {
      // We use 0 because the freshly created quiz has no questions (total score = 0)
      const updateDto = { passingScore: 0 };

      const response = await request(app.getHttpServer())
        .patch(`/api/quizzes/${quizId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.passingScore).toBe(0);
    });

    it('FAIL: should return 400 if passingScore exceeds total score', async () => {
      const invalidDto = { passingScore: 100 };

      const response = await request(app.getHttpServer())
        .patch(`/api/quizzes/${quizId}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toContain('cannot exceed total score');
    });
  });

  describe('DELETE /api/quizzes/:id', () => {
    it('SUCCESS: should delete an existing quiz', async () => {
      // Create a quiz specifically for deletion
      const res = await request(app.getHttpServer())
        .post('/api/quizzes')
        .send({ moduleId: new Types.ObjectId().toString() });

      const idToDelete = res.body._id;

      await request(app.getHttpServer())
        .delete(`/api/quizzes/${idToDelete}`)
        .expect(200);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/quizzes/${idToDelete}`)
        .expect(404);
    });
  });
});
