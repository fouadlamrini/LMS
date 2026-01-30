import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Types } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../src/auth/jwt.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { ModuleAccessGuard } from '../../src/module-access/module-access.guard';
import { Role } from '../../src/roles/role.enum';
import { QuizStatus, QuestionType } from '../../src/enums/quiz.enum';
import { applyGlobalSetup } from './setup';
import { mockQuiz } from '../mocks/quiz.mock';

describe('Quiz Attempts (e2e)', () => {
    let app: INestApplication;
    let courseId: string;
    let moduleId: string;
    let quizId: string;
    let questionId: string;
    let optionId: string;

    const currentUser = {
        userId: new Types.ObjectId().toString(),
        role: Role.LEARNER as string,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { ...currentUser };
                    return true;
                },
            })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(ModuleAccessGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        applyGlobalSetup(app);
        await app.init();

        // SETUP: Create course + module + quiz + question + enrollment
        const courseRes = await request(app.getHttpServer())
            .post('/api/courses')
            .send({
                title: mockQuiz.moduleId.courseId.title,
                description: 'Test Course',
                published: true,
            });
        courseId = courseRes.body._id;

        const moduleRes = await request(app.getHttpServer())
            .post('/api/course-modules')
            .send({
                title: mockQuiz.moduleId.title,
                courseId,
                order: 1,
            });
        moduleId = moduleRes.body._id;

        const quizRes = await request(app.getHttpServer())
            .post('/api/quizzes')
            .send({ moduleId });
        quizId = quizRes.body._id;

        const qRes = await request(app.getHttpServer())
            .post(`/api/quizzes/${quizId}/questions`)
            .send({
                text: 'E2E Question',
                type: QuestionType.MULTIPLE_CHOICE,
                score: 10,
                options: [{ text: 'Correct', correct: true }, { text: 'Wrong', correct: false }]
            });
        const lastQuestion = qRes.body.questions[qRes.body.questions.length - 1];
        questionId = lastQuestion._id;
        optionId = lastQuestion.options[0]._id;

        // Publish the quiz so attempts can start
        await request(app.getHttpServer())
            .patch(`/api/quizzes/${quizId}/status`)
            .send({ status: QuizStatus.PUBLISHED });

        // Enroll learner in the course so attempts are allowed
        await request(app.getHttpServer())
            .post('/api/enrollments')
            .send({ courseId });
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Full Attempt Workflow', () => {
        let attemptId: string;

        it('SUCCESS: should start a new attempt (POST :quizId/attempts)', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/${quizId}/attempts`)
                .expect(201);

            expect(res.body).toHaveProperty('_id');
            expect(res.body.completed).toBe(false);
            attemptId = res.body._id;
        });

        it('SUCCESS: should answer a question (POST /attempts/:id/answer)', async () => {
            await request(app.getHttpServer())
                .post(`/api/quizzes/attempts/${attemptId}/answer`)
                .send({
                    questionId: questionId,
                    selectedOptionIds: [optionId]
                })
                .expect(201);
        });

        it('FAIL: should return 400 when answering with invalid optionId', async () => {
            await request(app.getHttpServer())
                .post(`/api/quizzes/attempts/${attemptId}/answer`)
                .send({
                    questionId: questionId,
                    selectedOptionIds: [new Types.ObjectId().toString()]
                })
                .expect(400);
        });

        it('SUCCESS: should submit the attempt (POST /attempts/:id/submit)', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/attempts/${attemptId}/submit`)
                .expect(201);

            expect(res.body.completed).toBe(true);
            expect(res.body.submittedAt).toBeDefined();
            expect(res.body.score).toBe(10);
        });

        it('FAIL: should return 400 if trying to answer a submitted attempt', async () => {
            await request(app.getHttpServer())
                .post(`/api/quizzes/attempts/${attemptId}/answer`)
                .send({ questionId, selectedOptionIds: [optionId] })
                .expect(400);
        });
    });

    describe('Attempt Retrieval', () => {
        it('SUCCESS: should get all attempts for the learner (GET :quizId/attempts)', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/quizzes/${quizId}/attempts`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('SUCCESS: should get a single attempt with results (GET /attempts/:id)', async () => {
            // We need an ID from the previous test block
            const list = await request(app.getHttpServer()).get(`/api/quizzes/${quizId}/attempts`);
            const id = list.body[0]._id;

            const res = await request(app.getHttpServer())
                .get(`/api/quizzes/attempts/${id}`)
                .expect(200);

            expect(res.body).toHaveProperty('quizId');
            expect(res.body).toHaveProperty('answers');
        });
    });
});