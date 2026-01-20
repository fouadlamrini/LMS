'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Install: npm install @heroicons/react
import { getAllUsers } from '../../lib/users';
import { User } from '../../types/user';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State li kyt-controla bih l'affichage dial l'form
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">Error: {error}</div>;

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        
        {/* Button Ajouter */}
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Ajouter User</span>
        </button>
      </div>

      {/* --- Overlay Form (Hidden by default) --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nouveau Utilisateur</h2>
              <button onClick={() => setShowForm(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-black" />
              </button>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Full Name</label>
                <input type="text" className="border rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Nom complet" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Email</label>
                <input type="email" className="border rounded p-2" placeholder="email@example.com" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Password</label>
                <input type="password" className="border rounded p-2" placeholder="********" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Role</label>
                <select className="border rounded p-2 bg-white">
                  <option value="student">Admin</option>
                  <option value="admin">trainer</option>
                  <option value="instructor">Learner</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Student Number</label>
                <input type="text" className="border rounded p-2" placeholder="e.g. 2024001" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Birthdate</label>
                <input type="date" className="border rounded p-2" />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-semibold">Specialization</label>
                <input type="text" className="border rounded p-2" placeholder="Web Development, Data Science..." />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-semibold">Bio</label>
                <textarea className="border rounded p-2 h-24" placeholder="Brief description..."></textarea>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Table Section (Kima khllitiha) --- */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Full Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Student Number</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{user.fullName}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">{user.studentNumber || 'X'}</td>
                <td className="px-6 py-4">
                  <Link
                    href={`/users/${user._id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Review Details
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