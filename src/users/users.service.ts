import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { Role } from '../roles/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(data: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new this.userModel({
      ...data,
      password: hashedPassword,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }
}
