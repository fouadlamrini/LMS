import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../roles/role.enum';
import { QuestionType } from '../enums/quiz.enum';
import { Course } from '../courses/schemas/course.schema';
import { CourseModule } from '../course-modules/schemas/course-module.schema';
import { Quiz } from '../quizzes/schemas/quiz.schema';
import { User } from '../users/user.schema';

@Injectable()
export class CourseSeeder {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseModule.name) private moduleModel: Model<CourseModule>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async seed() {
    const courseCount = await this.courseModel.countDocuments();
    if (courseCount > 0) {
      console.log('Courses already seeded, skipping...');
      return;
    }

    // Get trainers
    const trainers = await this.userModel.find({ role: Role.TRAINER });
    if (trainers.length === 0) {
      console.log('⚠️  No trainers found. Please seed users first.');
      return;
    }

    // Course 1: Web Development
    const webDevCourse = await this.courseModel.create({
      title: 'Full-Stack Web Development',
      description:
        'Learn modern web development with React, Node.js, and MongoDB',
      published: true,
      trainerId: trainers[0]._id,
      modules: [],
    });

    // Modules for Web Dev Course
    const webModule1 = await this.moduleModel.create({
      title: 'Introduction to HTML & CSS',
      courseId: webDevCourse._id,
      order: 1,
      contents: [
        {
          type: 'video',
          url: 'https://example.com/videos/html-basics.mp4',
          title: 'HTML Basics',
        },
        {
          type: 'pdf',
          url: 'https://example.com/docs/html-guide.pdf',
          title: 'HTML Reference Guide',
        },
        {
          type: 'video',
          url: 'https://example.com/videos/css-intro.mp4',
          title: 'CSS Introduction',
        },
      ],
    });

    const webQuiz1 = await this.quizModel.create({
      moduleId: webModule1._id,
      passingScore: 70,
      questions: [
        {
          text: 'What does HTML stand for?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: [
            { text: 'Hyper Text Markup Language', correct: true },
            { text: 'High Tech Modern Language', correct: false },
            { text: 'Home Tool Markup Language', correct: false },
            { text: 'Hyperlinks and Text Markup Language', correct: false },
          ],
        },
        {
          text: 'Which CSS property is used to change text color?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: [
            { text: 'color', correct: true },
            { text: 'text-color', correct: false },
            { text: 'font-color', correct: false },
            { text: 'text-style', correct: false },
          ],
        },
      ],
    });

    webModule1.quizIds = [webQuiz1._id];
    await webModule1.save();

    const webModule2 = await this.moduleModel.create({
      title: 'JavaScript Fundamentals',
      courseId: webDevCourse._id,
      order: 2,
      contents: [
        {
          type: 'video',
          url: 'https://example.com/videos/js-basics.mp4',
          title: 'JavaScript Basics',
        },
        {
          type: 'pdf',
          url: 'https://example.com/docs/js-guide.pdf',
          title: 'JavaScript Guide',
        },
      ],
    });

    const webQuiz2 = await this.quizModel.create({
      moduleId: webModule2._id,
      passingScore: 75,
      questions: [
        {
          text: 'JavaScript is a compiled language.',
          type: QuestionType.TRUE_FALSE,
          options: [
            { text: 'True', correct: false },
            { text: 'False', correct: true },
          ],
        },
        {
          text: 'What is the correct syntax for a JavaScript function?',
          type: QuestionType.SHORT_ANSWER,
          correctAnswerText: 'function myFunction() {}',
        },
      ],
    });

    webModule2.quizIds = [webQuiz2._id];
    await webModule2.save();

    webDevCourse.modules = [webModule1._id, webModule2._id];
    await webDevCourse.save();

    // Course 2: Data Science
    const dataScienceCourse = await this.courseModel.create({
      title: 'Data Science with Python',
      description: 'Master data analysis, visualization, and machine learning',
      published: true,
      trainerId: trainers[1]._id,
      modules: [],
    });

    const dsModule1 = await this.moduleModel.create({
      title: 'Python for Data Science',
      courseId: dataScienceCourse._id,
      order: 1,
      contents: [
        {
          type: 'video',
          url: 'https://example.com/videos/python-intro.mp4',
          title: 'Python Introduction',
        },
        {
          type: 'pdf',
          url: 'https://example.com/docs/numpy-pandas.pdf',
          title: 'NumPy & Pandas Guide',
        },
      ],
    });

    const dsQuiz1 = await this.quizModel.create({
      moduleId: dsModule1._id,
      passingScore: 80,
      questions: [
        {
          text: 'Which libraries are commonly used for data science in Python?',
          type: QuestionType.MULTIPLE_SELECT,
          options: [
            { text: 'NumPy', correct: true },
            { text: 'Pandas', correct: true },
            { text: 'jQuery', correct: false },
            { text: 'Matplotlib', correct: true },
          ],
        },
      ],
    });

    dsModule1.quizIds = [dsQuiz1._id];
    await dsModule1.save();

    dataScienceCourse.modules = [dsModule1._id];
    await dataScienceCourse.save();

    // Course 3: Unpublished Draft
    await this.courseModel.create({
      title: 'Mobile App Development',
      description: 'Build native mobile apps with React Native',
      published: false,
      trainerId: trainers[0]._id,
      modules: [],
    });

    console.log('✅ Courses, modules, and quizzes seeded successfully');
  }

  async drop() {
    await this.quizModel.deleteMany({});
    await this.moduleModel.deleteMany({});
    await this.courseModel.deleteMany({});
    console.log('🗑️  Courses, modules, and quizzes cleared');
  }
}
