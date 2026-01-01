import { UsersService } from '../users/users.service';
import { Role } from '../roles/role.enum';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(usersService: UsersService) {
  const adminEmail = 'admin@admin.com';
  const existingAdmin = await usersService.findByEmail(adminEmail);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await usersService.create({
      fullName: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      studentNumber: 0,
      birthDate: new Date('2000-01-01'),
      specialization: 'Admin',
      bio: 'This is the super admin account',
    });

    console.log('✅ Admin account created successfully!');
  } else {
    console.log('⚠️ Admin already exists.');
  }
}
