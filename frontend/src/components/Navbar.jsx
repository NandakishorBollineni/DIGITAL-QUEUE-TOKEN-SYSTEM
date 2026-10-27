import React from 'react';
import { LayoutDashboard, Ticket, Users, Search, UserCheck, BarChart3, Info } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isDbConnected }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Token', icon: Ticket },
    { id: 'live', label: 'Live Queue Board', icon: Users },
    { id: 'track', label: 'Track Token', icon: Search },
    { id: 'staff', label: 'Staff Counter', icon: UserCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div className="brand-icon-wrapper">
            <Ticket size={22} />
          </div>
          <div>
            <div>Digital Queue Token System</div>
            <div className="brand-subtitle">MongoDB NoSQL Architecture</div>
          </div>
        </div>

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

        <div className="nav-status-badge">
          <span className={`status-dot ${isDbConnected ? 'connected' : ''}`} />
          <span>{isDbConnected ? 'MongoDB Connected' : 'DB Offline'}</span>
        </div>
      </div>
    </header>
  );
}
