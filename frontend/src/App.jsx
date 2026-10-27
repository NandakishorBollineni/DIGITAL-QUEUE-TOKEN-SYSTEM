import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import GenerateToken from './pages/GenerateToken';
import LiveQueue from './pages/LiveQueue';
import TrackToken from './pages/TrackToken';
import StaffQueue from './pages/StaffQueue';
import Analytics from './pages/Analytics';
import About from './pages/About';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Auth User State (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('digital_queue_user');
      return saved ? JSON.parse(saved) : {
        name: 'Bollineni Nanda Kishor',
        email: 'nanda.kishor@lpu.in',
        role: 'Staff Operator'
      };
    } catch {
      return null;
    }
  });

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'signin'
  });

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleOpenAuth = (mode = 'signin') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleCloseAuth = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleLoginSuccess = (user, message) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('digital_queue_user', JSON.stringify(user));
    } catch {
      // ignore storage errors
    }
    addToast(message || `Welcome, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('digital_queue_user');
    } catch {
      // ignore
    }
    addToast('Signed out successfully', 'info');
  };

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setIsDbConnected(data.status === 'healthy' && data.database?.status === 'connected');
    } catch {
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Navbar with Auth & MongoDB status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDbConnected={isDbConnected}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Page Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard setActiveTab={setActiveTab} addToast={addToast} currentUser={currentUser} />
        )}
        {activeTab === 'generate' && (
          <GenerateToken addToast={addToast} setActiveTab={setActiveTab} currentUser={currentUser} />
        )}
        {activeTab === 'live' && (
          <LiveQueue addToast={addToast} currentUser={currentUser} />
        )}
        {activeTab === 'track' && (
          <TrackToken addToast={addToast} />
        )}
        {activeTab === 'staff' && (
          <StaffQueue addToast={addToast} currentUser={currentUser} onOpenAuth={handleOpenAuth} />
        )}
        {activeTab === 'analytics' && (
          <Analytics addToast={addToast} />
        )}
        {activeTab === 'about' && (
          <About />
        )}
      </main>

      {/* Auth Modal (Sign In / Sign Up Demo) */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={handleCloseAuth}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toasts */}
      <Toast toasts={toasts} />

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>Digital Queue Token System</strong> — Intelligent NoSQL Database Platform
        </div>
        <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--slate-400)' }}>
          MongoDB Compass: <code>mongodb://127.0.0.1:27017/digital_queue</code>
        </div>
      </footer>
    </div>
  );
}
