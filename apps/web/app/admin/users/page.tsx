'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X, Eye } from 'lucide-react';
import { getAllUsers, createUser } from '../../../lib/users';
import { User } from '../../../types/user';
import { Role } from '../../../types/enums';

// 
const userSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role),
  studentNumber: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ),
  birthDate: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 2. React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: { role: Role.LEARNER }
  });

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 
  const onSubmit = async (data: UserFormData) => {
    try {
      
      await createUser(data);
      setSuccessMessage('User created successfully!');
      await fetchUsers();
      setShowForm(false);
      reset(); 
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 font-medium text-foreground">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Users Management</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary-hover text-white px-3 sm:px-4 py-2 rounded-lg transition-all shadow-sm font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span>Add User</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 bg-success/10 border-l-4 border-success text-success px-4 py-3 rounded shadow-sm">
          {successMessage}
        </div>
      )}

      {/* --- Modal Form --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">New User</h2>
              <button onClick={() => { setShowForm(false); reset(); }}>
                <X size={24} className="text-muted hover:text-error transition-colors" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              
              {/* Input Group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Full Name *</label>
                <input 
                  {...register('fullName')}
                  className={`border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-background text-foreground ${errors.fullName ? 'border-error bg-error/10' : 'border-border'}`}
                  placeholder="John Doe" 
                />
                {errors.fullName && <span className="text-error text-xs font-medium">{errors.fullName.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Email *</label>
                <input 
                  {...register('email')}
                  className={`border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-background text-foreground ${errors.email ? 'border-error bg-error/10' : 'border-border'}`}
                  placeholder="email@example.com" 
                />
                {errors.email && <span className="text-error text-xs font-medium">{errors.email.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Password *</label>
                <input 
                  type="password"
                  {...register('password')}
                  className={`border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-background text-foreground ${errors.password ? 'border-error bg-error/10' : 'border-border'}`}
                  placeholder="••••••••" 
                />
                {errors.password && <span className="text-error text-xs font-medium">{errors.password.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Role *</label>
                <select 
                  {...register('role')}
                  className="border border-border rounded-lg p-2.5 bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.TRAINER}>Trainer</option>
                  <option value={Role.LEARNER}>Learner</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Student Number</label>
                <input 
                  type="number"
                  {...register('studentNumber')}
                  className="border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="2024001" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Birthdate</label>
                <input 
                  type="date"
                  {...register('birthDate')}
                  className="border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button"
                  onClick={() => { setShowForm(false); reset(); }}
                  className="px-6 py-2.5 border border-border rounded-lg text-foreground hover:bg-background font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 font-semibold shadow-md transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Table --- */}
      <div className="bg-surface overflow-hidden shadow-sm border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-foreground">
            <thead className="text-xs text-muted uppercase bg-background border-b border-border">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold">Full Name</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold">Email</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold">Role</th>
                <th className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-background transition-colors">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-semibold text-foreground break-words">{user.fullName}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-muted break-words">{user.email}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase whitespace-nowrap ${
                      user.role === Role.ADMIN 
                        ? 'bg-secondary/20 text-secondary' 
                        : user.role === Role.TRAINER
                        ? 'bg-info/20 text-info'
                        : 'bg-success/20 text-success'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 text-right">
                    <Link
                      href={`/admin/users/${user._id}`}
                      className="inline-flex items-center gap-1.5 sm:gap-2 text-success hover:text-success/80 font-bold hover:underline transition-colors"
                    >
                      <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="hidden sm:inline">Review</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}