import { UsersService } from '../users/users.service';
import { Role } from '../roles/role.enum';

export async function seedAdmin(usersService: UsersService) {
  const adminEmail = 'admin@lms.com';
  const existingAdmin = await usersService.findByEmail(adminEmail);

  if (!existingAdmin) {
    await usersService.create({
      fullName: 'Super Admin',
      email: adminEmail,
      password: 'admin123',
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
