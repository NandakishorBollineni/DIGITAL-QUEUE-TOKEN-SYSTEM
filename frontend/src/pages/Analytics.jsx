import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, RefreshCw, Calendar, Database, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Analytics({ addToast }) {
  const [summary, setSummary] = useState(null);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [sumRes, dailyRes] = await Promise.all([
        api.getSummary(selectedDate),
        api.getDailyTrends(7)
      ]);
      setSummary(sumRes.data);
      setDailyTrends(dailyRes.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDate]);

  const total = summary?.total_tokens || 0;
  const waiting = summary?.waiting_tokens || 0;
  const serving = summary?.serving_tokens || 0;
  const completed = summary?.completed_tokens || 0;
  const cancelled = summary?.cancelled_tokens || 0;

  const waitPct = total > 0 ? Math.round((waiting / total) * 100) : 0;
  const servPct = total > 0 ? Math.round((serving / total) * 100) : 0;
  const compPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cancPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Queue Analytics & Aggregation Reports</h1>
          <p className="page-description">
            Live metrics aggregated directly from MongoDB using $match, $group, and $sort aggregation pipelines.
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

          <button className="btn btn-secondary" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'pulse-dot' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid: Status Distribution & Completed vs Cancelled */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Status Distribution */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={18} color="var(--primary)" />
              <span>Token Status Distribution</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Total: {total}</span>
          </div>

          {total === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
              No tokens recorded for {selectedDate}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Visual Breakdown Bar */}
              <div style={{ height: 20, width: '100%', background: 'var(--slate-100)', borderRadius: 99, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${compPct}%`, background: 'var(--success)' }} title={`Completed: ${compPct}%`} />
                <div style={{ width: `${servPct}%`, background: 'var(--info)' }} title={`Serving: ${servPct}%`} />
                <div style={{ width: `${waitPct}%`, background: 'var(--warning)' }} title={`Waiting: ${waitPct}%`} />
                <div style={{ width: `${cancPct}%`, background: 'var(--danger)' }} title={`Cancelled: ${cancPct}%`} />
              </div>

              {/* Legend & Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--success-text)', fontWeight: 700, textTransform: 'uppercase' }}>Completed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>{completed} ({compPct}%)</div>
                </div>

                <div style={{ padding: 12, background: 'var(--info-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--info-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--info-text)', fontWeight: 700, textTransform: 'uppercase' }}>Now Serving</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--info-text)', fontFamily: 'var(--font-mono)' }}>{serving} ({servPct}%)</div>
                </div>

                <div style={{ padding: 12, background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--warning-text)', fontWeight: 700, textTransform: 'uppercase' }}>Waiting</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)' }}>{waiting} ({waitPct}%)</div>
                </div>

                <div style={{ padding: 12, background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--danger-text)', fontWeight: 700, textTransform: 'uppercase' }}>Cancelled</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger-text)', fontFamily: 'var(--font-mono)' }}>{cancelled} ({cancPct}%)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Service Workload Breakdown */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--primary)" />
              <span>Service Counter Workload</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(summary?.service_breakdown || []).length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
                No service activity recorded for {selectedDate}.
              </div>
            ) : (
              summary.service_breakdown.map((svc) => {
                const svcPct = total > 0 ? Math.round((svc.total / total) * 100) : 0;
                return (
                  <div key={svc.service}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>{svc.service}</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate-600)' }}>{svc.total} tokens ({svcPct}%)</span>
                    </div>

                    <div style={{ height: 10, width: '100%', background: 'var(--slate-100)', borderRadius: 99, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${svcPct}%`,
                          background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
                          borderRadius: 99
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Daily Trends Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--primary)" />
            <span>Daily History Trends ($group by service_date)</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Date</th>
                <th>Total Tokens</th>
                <th>Waiting</th>
                <th>Serving</th>
                <th>Completed</th>
                <th>Cancelled</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {dailyTrends.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '28px', color: 'var(--slate-400)' }}>
                    No historical trends available.
                  </td>
                </tr>
              ) : (
                dailyTrends.map((d) => {
                  const rate = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
                  return (
                    <tr key={d.date}>
                      <td style={{ fontWeight: 700, color: 'var(--dark-navy)', fontFamily: 'var(--font-mono)' }}>
                        {d.date}
                      </td>
                      <td style={{ fontWeight: 700 }}>{d.total}</td>
                      <td><span style={{ color: 'var(--warning-text)', fontWeight: 600 }}>{d.waiting}</span></td>
                      <td><span style={{ color: 'var(--info-text)', fontWeight: 600 }}>{d.serving}</span></td>
                      <td><span style={{ color: 'var(--success-text)', fontWeight: 600 }}>{d.completed}</span></td>
                      <td><span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>{d.cancelled}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: rate >= 50 ? 'var(--success)' : 'var(--slate-600)' }}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course MongoDB Aggregation Demonstration */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--slate-300)' }}>
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} color="var(--primary)" />
            <span>MongoDB Aggregation Pipeline Architecture (CSE494 Curriculum)</span>
          </div>
        </div>

        <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: 16 }}>
          All analytics shown above are calculated directly within the MongoDB engine using native Aggregation Pipelines, avoiding loading large datasets into application memory:
        </p>

        <pre style={{
          background: 'var(--dark-navy)',
          color: '#e2e8f0',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-mono)',
          overflowX: 'auto',
          lineHeight: 1.4
        }}>
{`// MongoDB Aggregation Pipeline for Service & Status Summary
[
  { "$match": { "service_date": "${selectedDate}" } },
  {
    "$group": {
      "_id": { "service": "$service", "status": "$status" },
      "token_count": { "$sum": 1 }
    }
  },
  { "$sort": { "_id.service": 1, "_id.status": 1 } }
]`}
        </pre>
      </div>
    </div>
  );
}
