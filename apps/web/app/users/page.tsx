'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X } from 'lucide-react';
import { getAllUsers, createUser } from '../../lib/users';
import { User } from '../../types/user';
import { Role } from '../../types/enums';

// 
const userSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role),
  studentNumber: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
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
    resolver: zodResolver(userSchema),
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

  if (loading) return <div className="p-8 font-medium">Loading...</div>;

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
        >
          <Plus size={20} />
          <span>Ajouter User</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded shadow-sm">
          {successMessage}
        </div>
      )}

      {/* --- Modal Form --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">Nouveau Utilisateur</h2>
              <button onClick={() => { setShowForm(false); reset(); }}>
                <X size={24} className="text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Input Group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                <input 
                  {...register('fullName')}
                  className={`border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="John Doe" 
                />
                {errors.fullName && <span className="text-red-500 text-xs font-medium">{errors.fullName.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Email *</label>
                <input 
                  {...register('email')}
                  className={`border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="email@example.com" 
                />
                {errors.email && <span className="text-red-500 text-xs font-medium">{errors.email.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Password *</label>
                <input 
                  type="password"
                  {...register('password')}
                  className={`border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="••••••••" 
                />
                {errors.password && <span className="text-red-500 text-xs font-medium">{errors.password.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Role *</label>
                <select 
                  {...register('role')}
                  className="border border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.TRAINER}>Trainer</option>
                  <option value={Role.LEARNER}>Learner</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Student Number</label>
                <input 
                  type="number"
                  {...register('studentNumber')}
                  className="border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="2024001" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Birthdate</label>
                <input 
                  type="date"
                  {...register('birthDate')}
                  className="border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowForm(false); reset(); }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md transition-all"
                >
                  {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Table --- */}
      <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-bold">Full Name</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Role</th>
              <th className="px-6 py-4 font-bold">Student Number</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{user.fullName}</td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                   </span>
                </td>
                <td className="px-6 py-4">{user.studentNumber || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/users/${user._id}`}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}