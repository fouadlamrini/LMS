"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getUserById } from "../../../lib/users";
import { User } from "../../../types/user";
import { 
  User as UserIcon, Mail, Shield, Hash, 
  Calendar, GraduationCap, FileText, 
  PencilLine, Check, X 
} from "lucide-react";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id);
        setUser(data);
      } catch (err: any) {
        setError("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  // Function bach t-handle update f l-backend
  const handleUpdateField = async (fieldName: string, newValue: string) => {
    try {
      console.log(`Sending to API - ${fieldName}:`, newValue);
      // Hna ghadi t-dir l-fetch dyalk:
      // await updateUserService(id, { [fieldName]: newValue });
      
      // Update local state bach t-ban l-taghyir f l-blast
      if (user) {
        setUser({ ...user, [fieldName]: newValue });
      }
    } catch (err) {
      alert("Erreur f l-update!");
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Chargement...</div>;
  if (error) return <div className="p-8 text-red-500 text-center font-bold">Error: {error}</div>;
  if (!user) return <div className="p-8 text-center font-bold text-gray-400">User not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50/30">
      {/* --- Navigation Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-sm"
        >
          <span className="group-hover:-translate-x-1 transition-transform italic">←</span> Back to Users
        </button>
        <div className="md:text-right">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">User Details</h1>
          <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-widest italic">ID: {id}</p>
        </div>
      </div>

      {/* --- Profile Card --- */}
      <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 md:p-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            
            {/* Full Name */}
            <InfoItem 
              icon={<UserIcon size={22} className="text-blue-500" />} 
              label="Full Name" 
              initialValue={user.fullName} 
              onSave={(val: string) => handleUpdateField("fullName", val)}
            />

            {/* Email (Disabled for safety) */}
            <InfoItem 
              icon={<Mail size={22} className="text-emerald-500" />} 
              label="Email Address" 
              initialValue={user.email} 
              isDisable={true}
            />

            {/* Role (Select Dropdown) */}
            <InfoItem 
              icon={<Shield size={22} className="text-indigo-500" />} 
              label="Account Role" 
              initialValue={user.role} 
              isSelect={true}
              options={["Student", "Instructor", "Admin"]}
              onSave={(val: string) => handleUpdateField("role", val)}
            />

            {/* Student Number */}
            <InfoItem 
              icon={<Hash size={22} className="text-orange-500" />} 
              label="Student ID" 
              type="number"
              initialValue={user.studentNumber || 0} 
              onSave={(val: string) => handleUpdateField("studentNumber", val)}
            />

            {/* Birth Date */}
            <InfoItem 
              icon={<Calendar size={22} className="text-rose-500" />} 
              label="Birth Date" 
              type="date"
              initialValue={user.birthDate ? user.birthDate.split('T')[0] : ""} 
              onSave={(val: string) => handleUpdateField("birthDate", val)}
            />

            {/* Specialization */}
            <InfoItem 
              icon={<GraduationCap size={22} className="text-cyan-500" />} 
              label="Specialization" 
              initialValue={user.specialization || "General"} 
              onSave={(val: string) => handleUpdateField("specialization", val)}
            />

            {/* Bio (TextArea) */}
            <div className="md:col-span-2 bg-gray-50/50 rounded-3xl p-2 border border-dashed border-gray-200">
              <InfoItem 
                icon={<FileText size={22} className="text-slate-500" />} 
                label="Professional Biography" 
                initialValue={user.bio || "Write something interesting..."} 
                isTextArea={true}
                onSave={(val: string) => handleUpdateField("bio", val)}
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-16 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
            <div className="text-right italic">Last update: {new Date(user.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Component: InfoItem (The reusable Editing Logic) ---
function InfoItem({ 
  icon, label, initialValue, onSave, 
  type = "text", isDisable = false, 
  isTextArea = false, isSelect = false, options = [] 
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    if (value !== initialValue) onSave(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  return (
    <div className="group relative flex flex-col p-2 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-white shadow-sm rounded-xl group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      </div>

      <div className="flex justify-between items-center min-h-[48px] px-2">
        {isEditing ? (
          <div className="flex flex-col w-full gap-3 animate-in fade-in slide-in-from-top-1">
            {isSelect ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-3 bg-white border-2 border-blue-500 rounded-xl outline-none font-semibold text-gray-700 shadow-xl shadow-blue-500/10"
                autoFocus
              >
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : isTextArea ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-4 bg-white border-2 border-blue-500 rounded-2xl outline-none font-medium text-gray-700 min-h-[120px] shadow-xl shadow-blue-500/10"
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-3 bg-white border-2 border-blue-500 rounded-xl outline-none font-bold text-gray-700 shadow-xl shadow-blue-500/10"
                autoFocus
              />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200">
                <Check size={14} strokeWidth={3} /> Save
              </button>
              <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all active:scale-95">
                <X size={14} strokeWidth={3} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xl font-bold text-gray-800 tracking-tight leading-snug truncate max-w-[90%]">
              {value || <span className="text-gray-200 italic font-normal">Not provided</span>}
            </p>
            {!isDisable && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                title="Edit this field"
              >
                <PencilLine size={20} strokeWidth={2.5} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}