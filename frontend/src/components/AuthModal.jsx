import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal({ isOpen, initialMode = 'signin', onClose, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff Operator'); // 'Staff Operator' or 'Visitor'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = {
      name: mode === 'signup' ? (name.trim() || 'New User') : (email.split('@')[0] || 'Demo User'),
      email: email.trim() || 'user@example.com',
      role: mode === 'signup' ? role : (email.toLowerCase().includes('staff') ? 'Staff Operator' : 'Visitor'),
    };
    onLoginSuccess(user, mode === 'signin' ? 'Signed in successfully!' : 'Account registered successfully!');
    onClose();
  };

  const handleQuickDemoLogin = (demoRole) => {
    if (demoRole === 'Staff Operator') {
      const user = {
        name: 'Bollineni Staff',
        email: 'staff@queue.lpu.in',
        role: 'Staff Operator',
      };
      onLoginSuccess(user, 'Signed in as Staff Operator (Demo)');
    } else {
      const user = {
        name: 'Nanda Kishor',
        email: 'nanda.kishor@lpu.in',
        role: 'Visitor',
      };
      onLoginSuccess(user, 'Signed in as Visitor (Demo)');
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {mode === 'signin' ? <LogIn size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
                {mode === 'signin' ? 'Sign In to Portal' : 'Create an Account'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                Digital Queue Token System Access
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick 1-Click Demo Accounts Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
            <Sparkles size={14} />
            <span>Instant Demo 1-Click Login</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
              onClick={() => handleQuickDemoLogin('Staff Operator')}
            >
              <ShieldCheck size={14} />
              <span>Staff Demo</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
              onClick={() => handleQuickDemoLogin('Visitor')}
            >
              <User size={14} />
              <span>Visitor Demo</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--slate-200)', marginBottom: 18 }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${mode === 'signin' ? 'var(--primary)' : 'transparent'}`,
              fontWeight: 700,
              fontSize: '0.9rem',
              color: mode === 'signin' ? 'var(--primary)' : 'var(--slate-500)',
              cursor: 'pointer'
            }}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${mode === 'signup' ? 'var(--primary)' : 'transparent'}`,
              fontWeight: 700,
              fontSize: '0.9rem',
              color: mode === 'signup' ? 'var(--primary)' : 'var(--slate-500)',
              cursor: 'pointer'
            }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 36, height: 38 }}
                  placeholder="e.g. Bollineni Nanda Kishor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--slate-400)' }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Email or Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36, height: 38 }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--slate-400)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 36, height: 38 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--slate-400)' }} />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Account Role</label>
              <select
                className="form-select"
                style={{ height: 38, fontSize: '0.88rem' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Staff Operator">Staff Operator (Queue Counter)</option>
                <option value="Visitor">Visitor (Public)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: 4 }}>
            {mode === 'signin' ? 'Sign In' : 'Create Demo Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
