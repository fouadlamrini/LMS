"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { getUserById } from "../../../lib/users";
import { User } from "../../../types/user";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("User ID from params:", id);
    if (!id) {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    // Validate ObjectId format (24-character hexadecimal)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
      setError("Invalid user ID format");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getUserById(id);
        setUser(data);
      } catch (err: any) {
        console.error("Error fetching user details:", err);
        console.error("Error response:", err.response);
        if (err.response?.status === 404) {
          setError("User not found");
        } else if (err.response?.status === 500) {
          setError("Server error - please try again later");
        } else {
          setError("Failed to fetch user details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">Error: {error}</div>;
  if (!user) return <div className="p-8">User not found</div>;

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        ← Back to Users
      </button>

      <h1 className="text-2xl font-bold mb-6">User Details</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <p className="mt-1 text-lg">{user.fullName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <p className="mt-1 text-lg">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <p className="mt-1 text-lg">{user.role}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Student Number
            </label>
            <p className="mt-1 text-lg">{user.studentNumber || "-"}</p>
          </div>

          {user.birthDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birth Date
              </label>
              <p className="mt-1 text-lg">
                {new Date(user.birthDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {user.specialization && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Specialization
              </label>
              <p className="mt-1 text-lg">{user.specialization}</p>
            </div>
          )}

          {user.bio && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <p className="mt-1 text-lg">{user.bio}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Created At
            </label>
            <p className="mt-1 text-lg">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Updated At
            </label>
            <p className="mt-1 text-lg">
              {new Date(user.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
