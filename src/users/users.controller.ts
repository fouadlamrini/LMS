import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../roles/role.enum';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ================= PROFILE (SELF) =================

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  async updateMyProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }
}
