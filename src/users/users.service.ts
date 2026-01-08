import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(data: CreateUserDto): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.userModel.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  // get all users
  async findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  // get user by id
  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  // update user
  async update(id: string, data: Partial<CreateUserDto>): Promise<User | null> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  // delete user
  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id);
  }

  // ================= PROFILE (SELF) =================

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('user ma-l9it-hach');

    return this.userModel.findByIdAndUpdate(
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
    );
  }
}
