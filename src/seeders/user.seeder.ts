import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../roles/role.enum';
import { User } from '../users/user.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserSeeder {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private usersService: UsersService,
    ) { }

    async seed() {
        const count = await this.userModel.countDocuments();
        if (count > 0) {
            console.log('Users already seeded, skipping...');
            return;
        }

        // Plain passwords - UsersService will hash them
        const users = [
            {
                fullName: 'Admin User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: Role.ADMIN,
                bio: 'System administrator',
            },
            {
                fullName: 'John Trainer',
                email: 'john.trainer@example.com',
                password: 'Password123!',
                role: Role.TRAINER,
                specialization: 'Web Development',
                bio: 'Experienced full-stack developer and instructor',
            },
            {
                fullName: 'Sarah Coach',
                email: 'sarah.coach@example.com',
                password: 'Password123!',
                role: Role.TRAINER,
                specialization: 'Data Science',
                bio: 'Data scientist with 10+ years of experience',
            },
            {
                fullName: 'Alice Student',
                email: 'alice.student@example.com',
                password: 'Password123!',
                role: Role.LEARNER,
                studentNumber: 20230001,
                birthDate: new Date('2000-05-15'),
            },
            {
                fullName: 'Bob Learner',
                email: 'bob.learner@example.com',
                password: 'Password123!',
                role: Role.LEARNER,
                studentNumber: 20230002,
                birthDate: new Date('1999-08-22'),
            },
            {
                fullName: 'Charlie Student',
                email: 'charlie.student@example.com',
                password: 'Password123!',
                role: Role.LEARNER,
                studentNumber: 20230003,
                birthDate: new Date('2001-03-10'),
            },
        ];

        // Use UsersService.create() for each user (will hash passwords)
        for (const userData of users) {
            await this.usersService.create(userData as any);
        }
        
        console.log('✅ Users seeded successfully');
    }

    async drop() {
        await this.userModel.deleteMany({});
        console.log('🗑️  Users collection cleared');
    }
}