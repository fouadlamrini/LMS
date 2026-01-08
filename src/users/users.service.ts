import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // ================= ADMIN =================

  async create(data: CreateUserDto): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return await this.userModel.create(data);
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('User ma-l9it-hach');
    return user;
  }

  async updateByAdmin(id: string, data: Partial<CreateUserDto>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();
    if (!updated) throw new NotFoundException('User ma-l9it-hach');
    return updated;
  }

  async remove(id: string): Promise<User> {
    const deleted = await this.userModel
      .findByIdAndDelete(id)
      .select('-password')
      .exec();
    if (!deleted) throw new NotFoundException('User ma-l9it-hach');
    return deleted;
  }

  // ================= FIND BY EMAIL (for login & seeder) =================
  async findByEmail(email: string): Promise<User | null> {
    // <--- include password for bcrypt.compare
    return await this.userModel.findOne({ email }).exec();
  }

  // ================= PROFILE (SELF) =================

  async getMe(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User ma-l9it-hach');
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User ma-l9it-hach');

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            fullName: data.fullName,
            studentNumber: data.studentNumber,
            birthDate: data.birthDate,
            specialization: data.specialization,
            bio: data.bio,
          },
        },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!updated) throw new NotFoundException('User ma-l9it-hach');
    return updated;
  }
}
