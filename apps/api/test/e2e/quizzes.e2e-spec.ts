import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../src/auth/jwt.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { Role } from '../../src/roles/role.enum';
import { Types } from 'mongoose';

describe('Quizzes (e2e)', () => {
    let app: INestApplication;

    // A helper to simulate different user roles in our mocked guards
    const mockUser = {
        userId: new Types.ObjectId().toString(),
        role: Role.ADMIN,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // Bypass Authentication for E2E speed/simplicity
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = mockUser; // Injects mock user into @Request()
                    return true;
                },
            })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();

        // Mirror main.ts settings
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));

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
                    unknownField: 'hack'
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
});