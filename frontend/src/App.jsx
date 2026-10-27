import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
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

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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
      {/* Academic Banner */}
      <div className="academic-banner">
        <span><strong>Course:</strong> CSE494 Intelligent NoSQL Databases</span>
        <span>•</span>
        <span><strong>Student:</strong> Bollineni Nanda Kishor (Reg No: 12321100, Roll: 11)</span>
        <span>•</span>
        <span><strong>Guide:</strong> Shaik Sana Begum</span>
      </div>

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDbConnected={isDbConnected}
      />

      {/* Main Page View */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard setActiveTab={setActiveTab} addToast={addToast} />
        )}
        {activeTab === 'generate' && (
          <GenerateToken addToast={addToast} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'live' && (
          <LiveQueue addToast={addToast} />
        )}
        {activeTab === 'track' && (
          <TrackToken addToast={addToast} />
        )}
        {activeTab === 'staff' && (
          <StaffQueue addToast={addToast} />
        )}
        {activeTab === 'analytics' && (
          <Analytics addToast={addToast} />
        )}
        {activeTab === 'about' && (
          <About />
        )}
      </main>

      {/* Toasts */}
      <Toast toasts={toasts} />

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>Digital Queue Token System</strong> — Intelligent NoSQL Database Project
        </div>
        <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--slate-400)' }}>
          Lovely Professional University · Academic Year 2026–2027 · MongoDB Compass: <code>mongodb://127.0.0.1:27017/digital_queue</code>
        </div>
      </footer>
    </div>
  );
}
