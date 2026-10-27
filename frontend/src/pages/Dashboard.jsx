import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard({ setActiveTab, addToast }) {
  const [summary, setSummary] = useState(null);
  const [recentTokens, setRecentTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, recentRes] = await Promise.all([
        api.getSummary(selectedDate),
        api.listTokens({ service_date: selectedDate, limit: 6 })
      ]);
      setSummary(sumRes.data);
      setRecentTokens(recentRes.tokens || []);
    } catch (err) {
      addToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Queue Dashboard</h1>
          <p className="page-description">
            Live queue monitoring, service-day counters, and operational statistics backed by MongoDB.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
            <Calendar size={16} color="var(--slate-500)" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--slate-700)', fontFamily: 'inherit' }}
            />
          </div>

          <button className="btn btn-secondary" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'pulse-dot' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div>
            <div className="stat-label">Total Issued</div>
            <div className="stat-value">{summary?.total_tokens ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper">
            <Ticket size={24} />
          </div>
        </div>

        <div className="stat-card waiting">
          <div>
            <div className="stat-label">Waiting in Line</div>
            <div className="stat-value">{summary?.waiting_tokens ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card serving">
          <div>
            <div className="stat-label">Now Serving</div>
            <div className="stat-value">{summary?.serving_tokens ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="stat-card completed">
          <div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{summary?.completed_tokens ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="stat-card cancelled">
          <div>
            <div className="stat-label">Cancelled</div>
            <div className="stat-value">{summary?.cancelled_tokens ?? 0}</div>
          </div>
          <div className="stat-icon-wrapper">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Quick Actions & Service Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Service Queues Breakdown */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--primary)" />
              <span>Service Counter Breakdown</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 500 }}>Date: {selectedDate}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(summary?.service_breakdown || []).length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
                No token records found for this date.
              </div>
            ) : (
              summary.service_breakdown.map((svc) => {
                const total = svc.total || 1;
                const waitPct = Math.round((svc.waiting / total) * 100);
                const servPct = Math.round((svc.serving / total) * 100);
                const compPct = Math.round((svc.completed / total) * 100);

                return (
                  <div key={svc.service} style={{ borderBottom: '1px solid var(--slate-100)', paddingBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>{svc.service}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                        {svc.waiting} Waiting · {svc.serving} Serving · {svc.completed} Done
                      </span>
                    </div>

                    {/* Stacked Progress Bar */}
                    <div style={{ height: 8, width: '100%', background: 'var(--slate-100)', borderRadius: 99, display: 'flex', overflow: 'hidden' }}>
                      <div style={{ width: `${waitPct}%`, background: 'var(--warning)' }} title={`Waiting: ${svc.waiting}`} />
                      <div style={{ width: `${servPct}%`, background: 'var(--info)' }} title={`Serving: ${svc.serving}`} />
                      <div style={{ width: `${compPct}%`, background: 'var(--success)' }} title={`Completed: ${svc.completed}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title">
              <span>Quick Actions</span>
            </div>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.92rem', marginBottom: 20 }}>
              Access common operational workflows for visitors and staff members.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'space-between' }}
                onClick={() => setActiveTab('generate')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ticket size={20} />
                  <span>Generate Visitor Token</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <button
                className="btn btn-secondary btn-lg"
                style={{ width: '100%', justifyContent: 'space-between' }}
                onClick={() => setActiveTab('staff')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <UserCheck size={20} />
                  <span>Open Staff Counter Management</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <button
                className="btn btn-secondary btn-lg"
                style={{ width: '100%', justifyContent: 'space-between' }}
                onClick={() => setActiveTab('live')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RefreshCw size={20} />
                  <span>View Live Queue Board</span>
                </div>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 14, background: 'var(--slate-100)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--slate-600)' }}>
            <strong>MongoDB Compass Link:</strong><br />
            <code>mongodb://127.0.0.1:27017/digital_queue</code>
          </div>
        </div>
      </div>

      {/* Recent Tokens Activity */}
      <div className="card">
        <div className="card-title">
          <span>Recent Token Activity</span>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setActiveTab('live')}>
            View All Tokens <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Visitor Name</th>
                <th>Service</th>
                <th>Status</th>
                <th>Created At (UTC)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTokens.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-400)' }}>
                    No recent tokens for this date.
                  </td>
                </tr>
              ) : (
                recentTokens.map((t) => (
                  <tr key={t._id}>
                    <td className="token-num-cell">#{t.token_number}</td>
                    <td style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>{t.visitor_name}</td>
                    <td>{t.service}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => setActiveTab('staff')}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
