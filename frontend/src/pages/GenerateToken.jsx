import React, { useState } from 'react';
import { Ticket, CheckCircle2, Printer, PlusCircle, User, Briefcase, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const SERVICES = [
  { id: 'Admissions', title: 'Admissions', desc: 'University program enrolment, applications, counselling' },
  { id: 'Billing', title: 'Billing', desc: 'Tuition fees, payment receipts, refunds, accounts' },
  { id: 'General Enquiry', title: 'General Enquiry', desc: 'Campus info, academic timetable, student records' },
  { id: 'Document Verification', title: 'Document Verification', desc: 'Certificates, degrees, ID check, attestations' }
];

export default function GenerateToken({ addToast, setActiveTab, currentUser }) {
  const [visitorName, setVisitorName] = useState(currentUser?.name || '');
  const [service, setService] = useState('Admissions');
  const [loading, setLoading] = useState(false);
  const [issuedToken, setIssuedToken] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = visitorName.trim();
    if (!trimmed || trimmed.length < 2) {
      setErrorMsg('Please enter a valid visitor name (minimum 2 characters).');
      return;
    }
    if (trimmed.length > 100) {
      setErrorMsg('Visitor name cannot exceed 100 characters.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.createToken(trimmed, service);
      setIssuedToken(res.token);
      addToast(`Token #${res.token.token_number} generated successfully!`, 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to issue token. Please check database connection.');
      addToast(err.message || 'Token generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIssuedToken(null);
    setVisitorName('');
    setErrorMsg('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1 className="page-title">Generate Visitor Token</h1>
          <p className="page-description">
            Self-service digital kiosk for university campus counters. Token numbers are atomically generated via MongoDB counters.
          </p>
        </div>
      </div>

      {!issuedToken ? (
        <div className="card" style={{ maxWidth: 580, margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.9rem'
              }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="visitorName">
                Visitor Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="visitorName"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="e.g. Ramesh Kumar"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  maxLength={100}
                  disabled={loading}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--slate-400)' }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: 4, textAlign: 'right' }}>
                {visitorName.length} / 100 characters
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Select Service Counter <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {SERVICES.map((s) => {
                  const isSelected = service === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => !loading && setService(s.id)}
                      style={{
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--slate-200)'}`,
                        background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Briefcase size={16} color={isSelected ? 'var(--primary)' : 'var(--slate-500)'} />
                        <span style={{ fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--slate-800)', fontSize: '0.95rem' }}>
                          {s.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', lineHeight: 1.3 }}>
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 12 }}
              disabled={loading || !visitorName.trim()}
            >
              <Ticket size={20} />
              <span>{loading ? 'Allocating Concurrency-Safe Token...' : 'Generate Token Now'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Token Receipt Success View */
        <div className="token-receipt">
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Token Allocated Successfully
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', marginTop: 4 }}>
            Please wait for your token number to be announced at the counter.
          </p>

          <div style={{ margin: '24px 0', padding: '20px', background: 'var(--slate-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 700, letterSpacing: '0.05em' }}>
              {issuedToken.service} Counter
            </div>
            
            <div className="receipt-number">
              #{issuedToken.token_number}
            </div>

            <div style={{ display: 'inline-block', marginBottom: 12 }}>
              <StatusBadge status={issuedToken.status} />
            </div>

            <div style={{ fontSize: '0.92rem', color: 'var(--slate-700)', fontWeight: 600, borderTop: '1px solid var(--slate-200)', paddingTop: 14 }}>
              Visitor: <span style={{ color: 'var(--dark-navy)' }}>{issuedToken.visitor_name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: 8 }}>
              <span>Date: <strong>{issuedToken.service_date}</strong></span>
              <span>Time: <strong>{new Date(issuedToken.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print Slip</span>
            </button>
            <button className="btn btn-primary" onClick={handleReset}>
              <PlusCircle size={16} />
              <span>Issue Another Token</span>
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setActiveTab('live')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Go to Live Queue Display &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
