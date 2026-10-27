import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  PhoneCall,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const SERVICES = ['All Services', 'Admissions', 'Billing', 'General Enquiry', 'Document Verification'];

export default function StaffQueue({ addToast }) {
  const [selectedService, setSelectedService] = useState('All Services');
  const [servingToken, setServingToken] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Dialog states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'primary',
    action: null
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const serviceParam = selectedService === 'All Services' ? null : selectedService;

      // 1. Fetch currently serving token for this staff counter
      const servingRes = await api.listTokens({
        service: serviceParam,
        status: 'serving',
        limit: 1
      });
      setServingToken((servingRes.tokens && servingRes.tokens[0]) || null);

      // 2. Fetch waiting queue ordered deterministically
      const queueRes = await api.getQueue(serviceParam);
      setWaitingQueue(queueRes.queue || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch staff queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [selectedService]);

  // Actions with Confirmation
  const openConfirm = (title, message, confirmText, confirmVariant, action) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmVariant,
      action
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCallNext = () => {
    const serviceName = selectedService === 'All Services' ? 'any service' : selectedService;
    openConfirm(
      'Call Next Visitor',
      `Are you ready to atomically claim and call the next waiting visitor in ${serviceName}?`,
      'Call Next',
      'primary',
      async () => {
        try {
          setActionLoading(true);
          const serviceParam = selectedService === 'All Services' ? null : selectedService;
          const res = await api.callNext(serviceParam);
          addToast(res.message, 'success');
          await fetchStaffData();
        } catch (err) {
          addToast(err.message || 'No waiting visitors to call', 'error');
        } finally {
          setActionLoading(false);
          closeModal();
        }
      }
    );
  };

  const handleCallSpecific = (token) => {
    openConfirm(
      `Call Token #${token.token_number}`,
      `Transition Token #${token.token_number} (${token.visitor_name}) from 'waiting' to 'serving'?`,
      'Call Token',
      'primary',
      async () => {
        try {
          setActionLoading(true);
          const res = await api.callToken(token._id);
          addToast(res.message, 'success');
          await fetchStaffData();
        } catch (err) {
          addToast(err.message || 'Failed to call token', 'error');
        } finally {
          setActionLoading(false);
          closeModal();
        }
      }
    );
  };

  const handleComplete = (token) => {
    openConfirm(
      `Mark Completed: Token #${token.token_number}`,
      `Confirm service completion for Token #${token.token_number} (${token.visitor_name})?`,
      'Mark Completed',
      'success',
      async () => {
        try {
          setActionLoading(true);
          const res = await api.completeToken(token._id);
          addToast(res.message, 'success');
          await fetchStaffData();
        } catch (err) {
          addToast(err.message || 'Failed to complete token', 'error');
        } finally {
          setActionLoading(false);
          closeModal();
        }
      }
    );
  };

  const handleCancel = (token) => {
    openConfirm(
      `Cancel Token #${token.token_number}`,
      `Are you sure you want to cancel Token #${token.token_number} (${token.visitor_name})? The record will remain preserved in MongoDB for audit history.`,
      'Cancel Token',
      'danger',
      async () => {
        try {
          setActionLoading(true);
          const res = await api.cancelToken(token._id);
          addToast(res.message, 'success');
          await fetchStaffData();
        } catch (err) {
          addToast(err.message || 'Failed to cancel token', 'error');
        } finally {
          setActionLoading(false);
          closeModal();
        }
      }
    );
  };

  const filteredQueue = waitingQueue.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.visitor_name.toLowerCase().includes(q) ||
      String(t.token_number).includes(q) ||
      t.service.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Notice Banner */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: '0.86rem',
        color: '#92400e'
      }}>
        <ShieldAlert size={20} />
        <div>
          <strong>Academic Demonstration Mode:</strong> This staff interface demonstrates atomic conditional state updates (find_one_and_update) and lifecycle rules (waiting &rarr; serving &rarr; completed / cancelled).
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Counter Management</h1>
          <p className="page-description">
            Call next waiting visitors, manage counter service, and complete or cancel tokens safely.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Service filter */}
          <div style={{ minWidth: 200 }}>
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

          <button className="btn btn-secondary" onClick={fetchStaffData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'pulse-dot' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Staff Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 28 }}>
        
        {/* Active Serving Token Card */}
        <div className="card" style={{ border: '2px solid var(--info-border)', background: 'var(--surface)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} color="var(--primary)" />
              <span>Current Serving Visitor</span>
            </div>
            {servingToken && <StatusBadge status={servingToken.status} />}
          </div>

          {servingToken ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '16px 0' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {servingToken.service} Counter
                  </div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    #{servingToken.token_number}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginTop: 8 }}>
                    {servingToken.visitor_name}
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', textAlign: 'right' }}>
                  <div>Called at:</div>
                  <strong style={{ color: 'var(--slate-700)' }}>
                    {servingToken.called_at ? new Date(servingToken.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  onClick={() => handleComplete(servingToken)}
                  disabled={actionLoading}
                >
                  <CheckCircle size={18} />
                  <span>Mark Completed</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleCallNext()}
                  disabled={actionLoading || waitingQueue.length === 0}
                  title="Complete & Call Next"
                >
                  <PhoneCall size={18} />
                  <span>Call Next</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--slate-500)' }}>
              <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--slate-700)' }}>
                No Visitor Currently at Counter
              </div>
              <p style={{ fontSize: '0.85rem', margin: '6px 0 20px', color: 'var(--slate-500)' }}>
                {waitingQueue.length > 0
                  ? `${waitingQueue.length} visitor(s) are waiting in queue.`
                  : 'Waiting queue is currently empty.'}
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleCallNext}
                disabled={actionLoading || waitingQueue.length === 0}
              >
                <PhoneCall size={20} />
                <span>Call Next Visitor</span>
              </button>
            </div>
          )}
        </div>

        {/* Counter Summary & Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title">
              <span>Queue Status Overview</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                {waitingQueue.length} in Waiting Queue
              </span>
            </div>

            <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: 20 }}>
              Operating counter: <strong>{selectedService}</strong>. Clicking Call Next uses concurrency-safe atomic allocation to claim the earliest waiting ticket.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleCallNext}
                disabled={actionLoading || waitingQueue.length === 0}
              >
                <PhoneCall size={20} />
                <span>Call Next Eligible Visitor</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 14, background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--slate-600)', border: '1px solid var(--slate-200)' }}>
            <strong>Concurrency Rule:</strong><br />
            Protected by MongoDB <code>find_one_and_update</code>. Even if multiple staff members click "Call Next" simultaneously, each waiting visitor is claimed exactly once.
          </div>
        </div>
      </div>

      {/* Waiting Queue Table */}
      <div className="card">
        <div className="card-title">
          <span>Waiting Queue ({waitingQueue.length})</span>

          <div style={{ position: 'relative', width: 240 }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 34, paddingRight: 10, fontSize: '0.85rem', height: 36 }}
              placeholder="Filter waiting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--slate-400)' }} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Position</th>
                <th style={{ width: 100 }}>Token #</th>
                <th>Visitor Name</th>
                <th>Service</th>
                <th>Arrival Time</th>
                <th style={{ textAlign: 'right' }}>Staff Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--slate-400)' }}>
                    No waiting tokens in queue.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{t.queue_position}</td>
                    <td className="token-num-cell">#{t.token_number}</td>
                    <td style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>{t.visitor_name}</td>
                    <td>{t.service}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleCallSpecific(t)}
                          disabled={actionLoading}
                        >
                          <PhoneCall size={14} />
                          <span>Call</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.8rem', color: 'var(--danger)' }}
                          onClick={() => handleCancel(t)}
                          disabled={actionLoading}
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmVariant={modalConfig.confirmVariant}
        onConfirm={modalConfig.action}
        onCancel={closeModal}
      />
    </div>
  );
}
