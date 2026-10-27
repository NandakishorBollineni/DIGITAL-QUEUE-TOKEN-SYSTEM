import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    id: 'staff',
    title: 'Staff Counter Operator',
    badge: 'Counter Staff',
    name: 'Bollineni Staff',
    email: 'staff.counter@lpu.edu.in',
    password: 'Staff@Queue2026',
    role: 'Staff Operator',
    color: 'var(--primary)',
    bg: 'var(--primary-light)'
  },
  {
    id: 'visitor',
    title: 'Registered Visitor',
    badge: 'Campus Visitor',
    name: 'Bollineni Nanda Kishor',
    email: 'nanda.kishor@lpu.edu.in',
    password: 'Visitor@Queue2026',
    role: 'Visitor',
    color: '#059669',
    bg: '#ecfdf5'
  }
];

export default function AuthModal({ isOpen, initialMode = 'signin', onClose, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [selectedDemoId, setSelectedDemoId] = useState('staff');
  const [name, setName] = useState(DEMO_ACCOUNTS[0].name);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].password);
  const [role, setRole] = useState(DEMO_ACCOUNTS[0].role);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSelectDemo = (acc) => {
    setSelectedDemoId(acc.id);
    setName(acc.name);
    setEmail(acc.email);
    setPassword(acc.password);
    setRole(acc.role);
  };

  const handleQuickLogin = (acc) => {
    const user = {
      name: acc.name,
      email: acc.email,
      role: acc.role,
    };
    onLoginSuccess(user, `Signed in as ${acc.title} (${acc.role})`);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = {
      name: mode === 'signup' ? (name.trim() || 'New User') : (name.trim() || email.split('@')[0] || 'User'),
      email: email.trim() || 'user@example.com',
      role: mode === 'signup' ? role : (role || (email.toLowerCase().includes('staff') ? 'Staff Operator' : 'Visitor')),
    };
    onLoginSuccess(
      user,
      mode === 'signin' ? `Welcome back, ${user.name}!` : `Account created for ${user.name}!`
    );
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
            }}>
              {mode === 'signin' ? <LogIn size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark-navy)', letterSpacing: '-0.01em' }}>
                {mode === 'signin' ? 'Sign In to Account' : 'Create New Account'}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                Digital Queue Token System · Authentication
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--slate-100)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--slate-600)',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Demo Credentials Selection Block */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
              <Sparkles size={15} color="var(--primary)" />
              <span>Click a Demo Profile to Pre-fill or Instant Login:</span>
            </div>
            <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: 'var(--primary)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
              Demo Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedDemoId === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`demo-account-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectDemo(acc)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: acc.bg,
                      color: acc.color,
                      textTransform: 'uppercase'
                    }}>
                      {acc.badge}
                    </span>
                    {isSelected && <CheckCircle2 size={16} color="var(--primary)" />}
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                    {acc.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {acc.email}
                  </div>

                  <button
                    type="button"
                    style={{
                      marginTop: 8,
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: isSelected ? 'var(--primary)' : 'white',
                      color: isSelected ? 'white' : 'var(--slate-700)',
                      border: '1px solid var(--slate-300)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(acc);
                    }}
                  >
                    <KeyRound size={12} />
                    <span>Instant Login</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--slate-100)', marginBottom: 20 }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${mode === 'signin' ? 'var(--primary)' : 'transparent'}`,
              fontWeight: 700,
              fontSize: '0.92rem',
              color: mode === 'signin' ? 'var(--primary)' : 'var(--slate-500)',
              cursor: 'pointer',
              marginBottom: -2,
              transition: 'all 0.2s'
            }}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${mode === 'signup' ? 'var(--primary)' : 'transparent'}`,
              fontWeight: 700,
              fontSize: '0.92rem',
              color: mode === 'signup' ? 'var(--primary)' : 'var(--slate-500)',
              cursor: 'pointer',
              marginBottom: -2,
              transition: 'all 0.2s'
            }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: '0.84rem' }}>
                Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 38, height: 42 }}
                  placeholder="e.g. Bollineni Nanda Kishor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: '0.84rem' }}>
              Email Address <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 38, height: 42 }}
                placeholder="name@lpu.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: '0.84rem' }}>
              Password <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 40, height: 42 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-400)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: '0.84rem' }}>Account Role</label>
              <select
                className="form-select"
                style={{ height: 42, fontSize: '0.9rem' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Staff Operator">Staff Operator (Queue Counter Operator)</option>
                <option value="Visitor">Visitor (Student / Campus Visitor)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 6 }}
          >
            {mode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{mode === 'signin' ? `Sign In as ${role}` : 'Create Account & Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
