import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Search,
  UserCheck,
  BarChart3,
  Info,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isDbConnected,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Token', icon: Ticket },
    { id: 'live', label: 'Live Queue Board', icon: Users },
    { id: 'track', label: 'Track Token', icon: Search },
    { id: 'staff', label: 'Staff Counter', icon: UserCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="navbar-inner" style={{ maxWidth: 1360 }}>
        {/* Brand */}
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div className="brand-icon-wrapper">
            <Ticket size={22} />
          </div>
          <div>
            <div style={{ lineHeight: 1.2 }}>Digital Queue Token System</div>
            <div className="brand-subtitle">MongoDB NoSQL Platform</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav>
          <ul className="nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Auth & DB Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* DB Status Badge */}
          <div className="nav-status-badge" title="Live MongoDB Connection Status">
            <span className={`status-dot ${isDbConnected ? 'connected' : ''}`} />
            <span style={{ fontSize: '0.78rem' }}>{isDbConnected ? 'MongoDB Online' : 'DB Offline'}</span>
          </div>

          {/* User Profile or Sign In / Sign Up */}
          {currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--slate-100)',
              padding: '4px 10px 4px 6px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--slate-200)'
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: currentUser.role === 'Staff Operator' ? 'var(--primary)' : 'var(--success)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)'
              }}>
                {getInitials(currentUser.name)}
              </div>

              <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                  {currentUser.role}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 'var(--radius-full)', marginLeft: 4 }}
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                onClick={() => onOpenAuth('signin')}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={() => onOpenAuth('signup')}
              >
                <UserPlus size={14} />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
