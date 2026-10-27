import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, XCircle, UserCheck, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const SERVICES = ['Admissions', 'Billing', 'General Enquiry', 'Document Verification'];

export default function TrackToken({ addToast }) {
  const [searchMode, setSearchMode] = useState('number'); // 'number' or 'id'
  const [tokenNumber, setTokenNumber] = useState('');
  const [service, setService] = useState('Admissions');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setTokenResult(null);
    setSearched(true);

    try {
      setLoading(true);
      let res;
      if (searchMode === 'number') {
        const num = tokenNumber.trim();
        if (!num || isNaN(num)) {
          setErrorMsg('Please enter a valid numeric token number.');
          return;
        }
        res = await api.getTokenByNumber(service, num, serviceDate);
      } else {
        const tid = tokenId.trim();
        if (!tid) {
          setErrorMsg('Please enter a valid MongoDB Token ID.');
          return;
        }
        res = await api.getTokenById(tid);
      }

      setTokenResult(res.token);
    } catch (err) {
      setErrorMsg(err.message || 'Token not found. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div>
          <h1 className="page-title">Token Status Tracking</h1>
          <p className="page-description">
            Check live progress, queue position, and service timeline for your token.
          </p>
        </div>
      </div>

      {/* Lookup Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--slate-200)', paddingBottom: 14 }}>
          <button
            className={`btn ${searchMode === 'number' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            onClick={() => { setSearchMode('number'); setErrorMsg(''); setTokenResult(null); }}
          >
            Lookup by Token # & Service
          </button>
          <button
            className={`btn ${searchMode === 'id' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            onClick={() => { setSearchMode('id'); setErrorMsg(''); setTokenResult(null); }}
          >
            Lookup by MongoDB ObjectId
          </button>
        </div>

        <form onSubmit={handleSearch}>
          {searchMode === 'number' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Service Category</label>
                <select className="form-select" value={service} onChange={(e) => setService(e.target.value)}>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Service Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Token Number</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 42"
                  value={tokenNumber}
                  onChange={(e) => setTokenNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  <Search size={16} />
                  <span>{loading ? 'Searching...' : 'Track Token'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">MongoDB Document ObjectId</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 671e2b528a4c..."
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Search size={16} />
                <span>{loading ? 'Searching...' : 'Track Token'}</span>
              </button>
            </div>
          )}
        </form>

        {errorMsg && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {tokenResult && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                {tokenResult.service}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
                #{tokenResult.token_number}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 4 }}>
                Date: <strong>{tokenResult.service_date}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={tokenResult.status} />
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: 8 }}>
                MongoDB ID: <code>{tokenResult._id.slice(0, 10)}...</code>
              </div>
            </div>
          </div>

          {/* Interactive Lifecycle Timeline */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 20 }}>
            Token Lifecycle Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', paddingLeft: 28 }}>
            {/* Timeline Vertical Line */}
            <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: 'var(--slate-200)' }} />

            {/* Step 1: Created */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: -28,
                top: 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--success)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={14} />
              </div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>1. Token Created & Entered Queue</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {new Date(tokenResult.created_at).toLocaleString()}
              </div>
            </div>

            {/* Step 2: Called */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: -28,
                top: 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: tokenResult.called_at ? 'var(--info)' : 'var(--slate-300)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserCheck size={14} />
              </div>
              <div style={{ fontWeight: 700, color: tokenResult.called_at ? 'var(--dark-navy)' : 'var(--slate-400)' }}>
                2. Called to Service Counter
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {tokenResult.called_at ? new Date(tokenResult.called_at).toLocaleString() : 'Pending (Waiting for counter call)'}
              </div>
            </div>

            {/* Step 3: Finished / Cancelled */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: -28,
                top: 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: tokenResult.status === 'completed'
                  ? 'var(--success)'
                  : tokenResult.status === 'cancelled'
                  ? 'var(--danger)'
                  : 'var(--slate-300)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {tokenResult.status === 'cancelled' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
              </div>
              <div style={{ fontWeight: 700, color: (tokenResult.completed_at || tokenResult.cancelled_at) ? 'var(--dark-navy)' : 'var(--slate-400)' }}>
                3. {tokenResult.status === 'cancelled' ? 'Token Cancelled' : 'Service Completed'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {tokenResult.completed_at && `Completed at ${new Date(tokenResult.completed_at).toLocaleString()}`}
                {tokenResult.cancelled_at && `Cancelled at ${new Date(tokenResult.cancelled_at).toLocaleString()}`}
                {!tokenResult.completed_at && !tokenResult.cancelled_at && 'In-progress or awaiting completion'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
