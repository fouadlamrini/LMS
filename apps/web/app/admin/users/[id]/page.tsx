"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getUserById, updateUser } from "../../../../lib/users";
import { User } from "../../../../types/user";
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
  const handleUpdateField = async (fieldName: string, newValue: string | number) => {
    try {
      // Convert value based on field type
      let valueToSend: any = newValue;
      if (fieldName === 'studentNumber') {
        valueToSend = Number(newValue);
      } else if (fieldName === 'birthDate') {
        valueToSend = newValue ? new Date(newValue as string).toISOString() : undefined;
      }
      
      // Update in backend
      const updatedUser = await updateUser(id, { [fieldName]: valueToSend });
      
      // Update local state bach t-ban l-taghyir f l-blast
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating field:', err);
      alert("Error updating field!");
    }
  };

  if (loading) return <div className="text-center animate-pulse text-foreground">Loading...</div>;
  if (error) return <div className="text-error text-center font-bold">Error: {error}</div>;
  if (!user) return <div className="text-center font-bold text-muted">User not found</div>;

  return (
    <div className="w-full max-w-5xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
      {/* --- Navigation Header --- */}
      <div className="border-b border-border p-4 sm:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-surface transition-all shadow-sm"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> <span className="text-sm">Back to Users</span>
          </button>
          <div className="md:text-right">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Details</h1>
          </div>
        </div>
      </div>

      {/* --- Profile Card Content --- */}
      <div className="p-6 sm:p-8 md:p-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-8">
            
            {/* Full Name */}
            <InfoItem 
              icon={<UserIcon className="text-blue-400 w-5 h-4" />} 
              label="Full Name" 
              initialValue={user.fullName} 
              onSave={(val: string) => handleUpdateField("fullName", val)}
            />

            {/* Email (Disabled for safety) */}
            <InfoItem 
              icon={<Mail className="text-blue-400 w-5 h-4" />} 
              label="Email Address" 
              initialValue={user.email} 
              isDisable={true}
            />

            {/* Role (Select Dropdown) */}
            <InfoItem 
              icon={<Shield className="text-blue-400 w-5 h-4" />} 
              label="Account Role" 
              initialValue={user.role} 
              isSelect={true}
              options={["LEARNER", "TRAINER", "ADMIN"]}
              onSave={(val: string) => handleUpdateField("role", val)}
            />

            {/* Student Number */}
            <InfoItem 
              icon={<Hash className="text-blue-400 w-5 h-4" />} 
              label="Student ID" 
              type="number"
              initialValue={user.studentNumber || 0} 
              onSave={(val: string) => handleUpdateField("studentNumber", val)}
            />

            {/* Birth Date */}
            <InfoItem 
              icon={<Calendar className="text-blue-400 w-5 h-4" />} 
              label="Birth Date" 
              type="date"
              initialValue={user.birthDate ? user.birthDate.split('T')[0] : ""} 
              onSave={(val: string) => handleUpdateField("birthDate", val)}
            />

            {/* Specialization */}
            <InfoItem 
              icon={<GraduationCap className="text-blue-400 w-5 h-4" />} 
              label="Specialization" 
              initialValue={user.specialization || "General"} 
              onSave={(val: string) => handleUpdateField("specialization", val)}
            />

            {/* Bio (TextArea) */}
            <div className="md:col-span-3 bg-background rounded-xl p-2 border border-dashed border-border">
              <InfoItem 
                icon={<FileText className="text-blue-400 w-5 h-4" />} 
                label="Professional Biography" 
                initialValue={user.bio || "Write something interesting..."} 
                isTextArea={true}
                onSave={(val: string) => handleUpdateField("bio", val)}
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted">
            <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
            <div className="sm:text-right">Last update: {new Date(user.updatedAt).toLocaleDateString()}</div>
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
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="p-2 bg-surface shadow-sm rounded-lg group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        <span className="text-xs sm:text-sm font-semibold text-muted">{label}</span>
      </div>

      <div className="flex justify-between items-center min-h-12 px-2">
        {isEditing ? (
          <div className="flex flex-col w-full gap-3 animate-in fade-in slide-in-from-top-1">
            {isSelect ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-2.5 bg-background border border-primary rounded-lg outline-none text-sm text-foreground focus:ring-2 focus:ring-primary/20"
                autoFocus
              >
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : isTextArea ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-2.5 bg-background border border-primary rounded-lg outline-none text-sm text-foreground min-h-25 focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-2.5 bg-background border border-primary rounded-lg outline-none text-sm text-foreground focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={handleSave} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-all active:scale-95 shadow-sm">
                <Check size={14} strokeWidth={3} /> Save
              </button>
              <button onClick={handleCancel} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-background border border-border text-muted rounded-lg text-xs font-bold hover:bg-surface transition-all active:scale-95">
                <X size={14} strokeWidth={3} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground truncate max-w-[90%]">
              {value || <span className="text-muted italic font-normal">Not provided</span>}
            </p>
            {!isDisable && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                title="Edit this field"
              >
                <PencilLine size={18} strokeWidth={2.5} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}