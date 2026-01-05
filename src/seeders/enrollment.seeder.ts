import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Role } from '../roles/role.enum';
import { Enrollment } from '../enrollments/schemas/enrollment.schema';
import { QuizAttempt } from '../quizzes/schemas/quiz-attempt.schema';
import { User } from '../users/user.schema';
import { Course } from '../courses/schemas/course.schema';
import { CourseModule } from '../course-modules/schemas/course-module.schema';
import { Quiz } from '../quizzes/schemas/quiz.schema';

@Injectable()
export class EnrollmentSeeder {
    constructor(
        @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
        @InjectModel(QuizAttempt.name) private quizAttemptModel: Model<QuizAttempt>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Course.name) private courseModel: Model<Course>,
        @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
        @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    ) { }

    async seed() {
        const enrollmentCount = await this.enrollmentModel.countDocuments();
        if (enrollmentCount > 0) {
            console.log('Enrollments already seeded, skipping...');
            return;
        }

        const learners = await this.userModel.find({ role: Role.LEARNER });
        const courses = await this.courseModel.find({ published: true });

        if (learners.length === 0 || courses.length === 0) {
            console.log('⚠️  No learners or courses found. Please seed users and courses first.');
            return;
        }

        // Alice enrolls in Web Development - completed first module
        const webDevCourse = courses.find(c => c.title.includes('Web Development'));
        if (webDevCourse) {
            const modules = await this.moduleModel.find({ courseId: webDevCourse._id }).sort({ order: 1 });

            if (modules.length > 0) {
                const quiz = await this.quizModel.findOne({ moduleId: modules[0]._id });

                let quizAttemptIds: Types.ObjectId[] = [];
                if (quiz && quiz.questions.length >= 2) {
                    // Get the full quiz with populated _id fields
                    const fullQuiz = await this.quizModel.findById(quiz._id);

                    if (fullQuiz && fullQuiz.questions.length >= 2) {
                        const quizAttempt = await this.quizAttemptModel.create({
                            quizId: fullQuiz._id,
                            answers: [
                                {
                                    // Convert to unknown then string to satisfy the ObjectId constructor
                                    questionId: new Types.ObjectId(fullQuiz.questions[0]._id as unknown as string),
                                    selectedOptionIds: [
                                        new Types.ObjectId(fullQuiz.questions[0].options?.[0]?._id as unknown as string)
                                    ],
                                },
                                {
                                    questionId: new Types.ObjectId(fullQuiz.questions[1]._id as unknown as string),
                                    selectedOptionIds: [
                                        new Types.ObjectId(fullQuiz.questions[1].options?.[0]?._id as unknown as string)
                                    ],
                                },
                            ],
                            score: 100,
                            passed: true,
                            submittedAt: new Date(),
                        });

                        // Assign the ID to the outer variable
                        quizAttemptIds = [quizAttempt._id as Types.ObjectId];
                    }
                }

                await this.enrollmentModel.create({
                    courseId: webDevCourse._id,
                    learnerId: learners[0]._id,
                    moduleProgress: [
                        {
                            moduleId: modules[0]._id,
                            completed: true,
                            quizAttemptIds,
                        },
                        {
                            moduleId: modules[1]._id,
                            completed: false,
                            quizAttemptIds: [],
                        },
                    ],
                    overallProgress: 50,
                    status: 'active',
                });
            }
        }

        // Bob enrolls in both courses - just started
        await this.enrollmentModel.create({
            courseId: courses[0]._id,
            learnerId: learners[1]._id,
            moduleProgress: [],
            overallProgress: 0,
            status: 'active',
        });

        if (courses.length > 1) {
            await this.enrollmentModel.create({
                courseId: courses[1]._id,
                learnerId: learners[1]._id,
                moduleProgress: [],
                overallProgress: 0,
                status: 'active',
            });
        }

        // Charlie enrolls in Data Science - dropped
        const dataScienceCourse = courses.find(c => c.title.includes('Data Science'));
        if (dataScienceCourse && learners.length > 2) {
            await this.enrollmentModel.create({
                courseId: dataScienceCourse._id,
                learnerId: learners[2]._id,
                moduleProgress: [],
                overallProgress: 0,
                status: 'dropped',
            });
        }

        console.log('✅ Enrollments and quiz attempts seeded successfully');
    }

    async drop() {
        await this.quizAttemptModel.deleteMany({});
        await this.enrollmentModel.deleteMany({});
        console.log('🗑️  Enrollments and quiz attempts cleared');
    }
}