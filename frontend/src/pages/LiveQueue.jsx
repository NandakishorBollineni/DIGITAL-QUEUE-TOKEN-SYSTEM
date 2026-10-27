import React, { useState, useEffect } from 'react';
import { Users, Filter, Search, RefreshCw, Volume2, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const SERVICES = ['All Services', 'Admissions', 'Billing', 'General Enquiry', 'Document Verification'];
const STATUSES = ['All Statuses', 'waiting', 'serving', 'completed', 'cancelled'];

export default function LiveQueue({ addToast }) {
  const [tokens, setTokens] = useState([]);
  const [servingTokens, setServingTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoPoll, setAutoPoll] = useState(true);
  const [selectedService, setSelectedService] = useState('All Services');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchQueueData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const serviceParam = selectedService === 'All Services' ? null : selectedService;
      const statusParam = selectedStatus === 'All Statuses' ? null : selectedStatus;

      // 1. Fetch current serving tokens across counters
      const servingRes = await api.listTokens({
        status: 'serving',
        service: serviceParam,
        limit: 10
      });
      setServingTokens(servingRes.tokens || []);

      // 2. Fetch full filtered list or waiting queue
      const listRes = await api.listTokens({
        service: serviceParam,
        status: statusParam,
        search: searchQuery.trim() || null,
        limit: 50
      });

      // Calculate queue positions for waiting tokens
      let pos = 1;
      const enrichedTokens = (listRes.tokens || []).map((t) => {
        if (t.status === 'waiting') {
          return { ...t, queue_position: pos++ };
        }
        return { ...t, queue_position: '-' };
      });

      setTokens(enrichedTokens);
      setLastRefreshed(new Date());
    } catch (err) {
      if (!silent) addToast(err.message || 'Failed to refresh queue data', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch and dependency update
  useEffect(() => {
    fetchQueueData();
  }, [selectedService, selectedStatus, searchQuery]);

  // Periodic polling (clearly labeled auto-refresh polling every 5s)
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchQueueData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPoll, selectedService, selectedStatus, searchQuery]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Public Queue Board</h1>
          <p className="page-description">
            Real-time visual display for waiting hall monitors and counter displays.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Auto-refresh polling toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: 'var(--surface)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--slate-200)',
            color: autoPoll ? 'var(--primary)' : 'var(--slate-500)'
          }}>
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>Auto-refresh (Polling 5s)</span>
          </label>

          <button className="btn btn-secondary" onClick={() => fetchQueueData(false)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'pulse-dot' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Now Serving Live Spotlight */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          Now Serving at Counters
        </h2>

        {servingTokens.length === 0 ? (
          <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', background: 'var(--surface)' }}>
            No tokens are currently being served. Staff can click "Call Next" in Staff Counter.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {servingTokens.map((t) => (
              <div
                key={t._id}
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  padding: '20px',
                  boxShadow: '0 8px 16px rgba(30, 58, 138, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd', fontWeight: 700 }}>
                    {t.service}
                  </span>
                  <span className="pulse-dot" style={{ background: '#60a5fa' }} />
                </div>

                <div style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', margin: '8px 0', lineHeight: 1 }}>
                  #{t.token_number}
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {t.visitor_name}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} />
                  <span>Called at: {t.called_at ? new Date(t.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: 220, flex: '1 1 220px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Search visitor name or token #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--slate-400)' }} />
            </div>

            {/* Service filter */}
            <div style={{ minWidth: 160 }}>
              <select
                className="form-select"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div style={{ minWidth: 150 }}>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st === 'All Statuses' ? 'All Statuses' : st.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', whiteSpace: 'nowrap' }}>
            Updated: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Queue Pos</th>
              <th style={{ width: 110 }}>Token #</th>
              <th>Visitor Name</th>
              <th>Service</th>
              <th>Status</th>
              <th>Created (Arrival)</th>
              <th>Wait / Serving Details</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--slate-400)' }}>
                  <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-600)' }}>No tokens found matching criteria</div>
                  <div style={{ fontSize: '0.85rem' }}>Generate a token or select different filters.</div>
                </td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 800, color: t.status === 'waiting' ? 'var(--primary)' : 'var(--slate-400)', fontSize: '0.95rem' }}>
                    {t.queue_position !== '-' ? `#${t.queue_position}` : '—'}
                  </td>
                  <td className="token-num-cell">
                    #{t.token_number}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>
                    {t.visitor_name}
                  </td>
                  <td>{t.service}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                    {t.status === 'serving' && (
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Being served at counter</span>
                    )}
                    {t.status === 'completed' && (
                      <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Completed
                      </span>
                    )}
                    {t.status === 'cancelled' && (
                      <span style={{ color: 'var(--danger)' }}>Cancelled</span>
                    )}
                    {t.status === 'waiting' && (
                      <span>Waiting in line</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
