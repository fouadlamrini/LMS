'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Hada houwa l-Default Export li Next.js darouri khasso i-l9ah
export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      
      {/* Header: Go Back Button */}
      <header style={headerStyle}>
        <button onClick={() => router.back()} style={backButtonStyle}>
          ← Go Back
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Settings</h1>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar Navigation */}
        <aside style={sidebarStyle}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('profile')} 
              style={tabButtonStyle(activeTab === 'profile')}
            >
              👤 Update Profile
            </button>
            <button 
              onClick={() => setActiveTab('password')} 
              style={tabButtonStyle(activeTab === 'password')}
            >
              🔑 Change Password
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '40px', backgroundColor: '#fff' }}>
          {activeTab === 'profile' ? <ProfileForm /> : <PasswordForm />}
        </main>

      </div>
    </div>
  );
}

// --- Component 1: Profile Form ---
function ProfileForm() {
  const [formData, setFormData] = useState({
    fullName: "ayoub jebouri",
    studentNumber: 7,
    birthDate: "2005-01-01",
    specialization: "Full Stack Development",
    bio: "Kanbghi n3lm web development",
    email: "ayoub.jebouri@example.com",
    role: "Student"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2>Personal Information</h2>
      <form style={formStyle}>
        <label style={labelStyle}>Full Name</label>
        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} style={inputStyle} />

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input type="text" value={formData.email} disabled style={disabledInputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Role</label>
            <input type="text" value={formData.role} disabled style={disabledInputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Student Number</label>
            <input type="number" name="studentNumber" value={formData.studentNumber} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Birth Date</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <label style={{ ...labelStyle, marginTop: '15px' }}>Specialization</label>
        <select name="specialization" value={formData.specialization} onChange={handleChange} style={inputStyle}>
          <option value="Full Stack Development">Full Stack Development</option>
          <option value="Mobile Development">Mobile Development</option>
        </select>

        <label style={{ ...labelStyle, marginTop: '15px' }}>Bio</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }} />

        <button type="submit" style={saveButtonStyle}>Update Profile</button>
      </form>
    </div>
  );
}

// --- Component 2: Password Form ---
function PasswordForm() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      <h2>Security Settings</h2>
      <form style={formStyle}>
        <label style={labelStyle}>Current Password</label>
        <input 
          type="password" 
          name="currentPassword" 
          placeholder="••••••••"
          value={passwords.currentPassword}
          onChange={handlePassChange}
          style={inputStyle} 
        />

        <label style={labelStyle}>New Password</label>
        <input 
          type="password" 
          name="newPassword" 
          placeholder="••••••••"
          value={passwords.newPassword}
          onChange={handlePassChange}
          style={inputStyle} 
        />

      

        <button type="submit" style={{ ...saveButtonStyle, backgroundColor: '#dc2626' }}>
          Change Password
        </button>
      </form>
    </div>
  );
}

// --- STYLES OBJECTS ---
const headerStyle = { padding: '15px 30px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#fff' };
const sidebarStyle = { width: '250px', backgroundColor: '#f8f9fa', padding: '30px 20px', borderRight: '1px solid #eee' };
const backButtonStyle = { padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: '#ececec', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' };
const disabledInputStyle = { ...inputStyle, backgroundColor: '#f0f0f0', color: '#888', cursor: 'not-allowed' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const saveButtonStyle = { padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };
const formStyle = { display: 'flex', flexDirection: 'column', marginTop: '20px' };

const tabButtonStyle = (isActive) => ({
  padding: '12px', textAlign: 'left', border: 'none', borderRadius: '8px', cursor: 'pointer',
  backgroundColor: isActive ? '#0070f3' : 'transparent', color: isActive ? 'white' : '#333',
  fontWeight: isActive ? 'bold' : 'normal', transition: '0.2s'
});