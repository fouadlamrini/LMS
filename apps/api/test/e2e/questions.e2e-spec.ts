import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Types } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../src/auth/jwt.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { Role } from '../../src/roles/role.enum';
import { QuestionType } from '../../src/enums/quiz.enum';
import { applyGlobalSetup } from './setup';
import { mockQuiz } from '../mocks/quiz.mock';

describe('Questions (e2e)', () => {
    let app: INestApplication;
    let quizId: string;

    // Admin user by default for setup/creation
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
                    req.user = { ...currentUser };
                    return true;
                },
            })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        applyGlobalSetup(app);
        await app.init();

        // Setup: Create a quiz to attach questions to
        const quizRes = await request(app.getHttpServer())
            .post('/api/quizzes')
            .send({ moduleId: mockQuiz.moduleId._id });
        quizId = quizRes.body._id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/quizzes/:quizId/questions', () => {
        it('SUCCESS: should add a MULTIPLE_CHOICE question', async () => {
            const dto = {
                text: 'What is NestJS?',
                type: QuestionType.MULTIPLE_CHOICE,
                score: 5,
                options: [
                    { text: 'Framework', correct: true },
                    { text: 'Library', correct: false },
                ],
            };

            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/${quizId}/questions`)
                .send(dto)
                .expect(201);

            expect(res.body.questions).toBeDefined();
            // Verify passingScore was recalculated by service
            expect(res.body.passingScore).toBeDefined();
        });

        it('FAIL: should return 400 for invalid TRUE_FALSE (with options)', async () => {
            const dto = {
                text: 'Incorrect T/F',
                type: QuestionType.TRUE_FALSE,
                score: 5,
                options: [{ text: 'Should not be here', correct: true }],
                correctAnswerBoolean: true,
            };

            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/${quizId}/questions`)
                .send(dto)
                .expect(400);

            expect(res.body.message).toContain('must not have options');
        });
    });

    describe('GET /api/quizzes/:quizId/questions/:questionId', () => {
        let questionId: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/${quizId}/questions`)
                .send({
                    text: 'Security Test',
                    type: QuestionType.MULTIPLE_CHOICE,
                    options: [{ text: 'Correct', correct: true }, { text: 'Wrong', correct: false }],
                    score: 10
                });
            // In your service, addQuestion returns the whole Quiz. 
            // We grab the last question added.
            const questions = res.body.questions;
            questionId = questions[questions.length - 1]._id;
        });

        it('SUCCESS: should return question and HIDE "correct" field from options', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/quizzes/${quizId}/questions/${questionId}`)
                .expect(200);

            expect(res.body.text).toBe('Security Test');
            // Critical security check: correct property should be excluded by DTO
            expect(res.body.options[0]).not.toHaveProperty('correct');
        });

        it('FAIL: should return 404 for non-existent question', async () => {
            const fakeQId = new Types.ObjectId().toString();
            return request(app.getHttpServer())
                .get(`/api/quizzes/${quizId}/questions/${fakeQId}`)
                .expect(404);
        });
    });

    describe('PATCH /api/quizzes/:quizId/questions/:questionId', () => {
        let qId: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/${quizId}/questions`)
                .send({
                    text: 'Update Me',
                    type: QuestionType.SHORT_ANSWER,
                    correctAnswerText: 'Old',
                    score: 5
                });
            qId = res.body.questions[res.body.questions.length - 1]._id;
        });

        it('SUCCESS: should update question text', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/quizzes/${quizId}/questions/${qId}`)
                .send({ text: 'New Text' })
                .expect(200);

            const updated = res.body.questions.find((q: any) => q._id === qId);
            expect(updated.text).toBe('New Text');
        });
    });

    describe('DELETE /api/quizzes/:quizId/questions/:questionId', () => {
        it('SUCCESS: should remove question and update quiz score', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/quizzes/${quizId}/questions`)
                .send({ text: 'Delete Me', type: QuestionType.TRUE_FALSE, correctAnswerBoolean: true, score: 10 });

            const qId = res.body.questions[res.body.questions.length - 1]._id;

            await request(app.getHttpServer())
                .delete(`/api/quizzes/${quizId}/questions/${qId}`)
                .expect(200);

            // Verify 404 on subsequent get
            await request(app.getHttpServer())
                .get(`/api/quizzes/${quizId}/questions/${qId}`)
                .expect(404);
        });
    });
});