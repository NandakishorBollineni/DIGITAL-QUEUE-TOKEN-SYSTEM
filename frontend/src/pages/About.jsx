import React from 'react';
import { Database, GraduationCap, CheckCircle2, Server, Shield, Cpu, ExternalLink, Code } from 'lucide-react';

export default function About() {
  const mongoCompassUri = "mongodb://127.0.0.1:27017/digital_queue";

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div>
          <h1 className="page-title">Digital Queue Token System</h1>
          <p className="page-description">
            Course CSE494: Intelligent NoSQL Databases · Lovely Professional University
          </p>
        </div>
      </div>

      {/* Academic Information Card */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              Academic Project Information
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
              School of Computer Science and Engineering
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Student Name</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>Bollineni Nanda Kishor</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Registration Number</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)', fontFamily: 'var(--font-mono)' }}>12321100</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Roll Number & Section</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>Roll #11 (CSE & K23DF)</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Faculty Guide</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>Shaik Sana Begum (Assistant Professor)</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Course Details</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>CSE494 — Intelligent NoSQL Databases</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Academic Year</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>2026–2027</div>
          </div>
        </div>
      </div>

      {/* MongoDB Compass Connection */}
      <div className="card" style={{ marginBottom: 24, background: 'var(--dark-navy)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Database size={24} color="#60a5fa" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
            MongoDB Compass Direct Connection
          </h3>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: 16 }}>
          You can inspect the live collections, schema validators, indexes, and documents in MongoDB Compass by pasting the following connection URI:
        </p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.95rem',
          color: '#93c5fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{mongoCompassUri}</span>
          <span style={{ fontSize: '0.78rem', background: '#2563eb', color: 'white', padding: '3px 8px', borderRadius: 4 }}>
            Direct Connect
          </span>
        </div>
      </div>

      {/* 6 Core NoSQL Concepts Demonstration */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-navy)', marginBottom: 20 }}>
          Six Core NoSQL Concepts Demonstrated
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <strong>1</strong>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>CRUD Operations with Non-Destructive Cancellation</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 2 }}>
                Implements <code>insert_one</code>, <code>find</code>, <code>find_one</code>, and <code>find_one_and_update</code>. Rather than permanently deleting records upon cancellation, documents transition to <code>status='cancelled'</code> with an audit timestamp, maintaining accurate queue numbering and compliance.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <strong>2</strong>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>Querying & Filtering</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 2 }}>
                Deterministic sorting by <code>[('token_number', 1), ('_id', 1)]</code> with scoped filtering by service and service-date. Supports visitor name regex search and exact integer lookup.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <strong>3</strong>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>Native Aggregation Pipelines</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 2 }}>
                Uses <code>$match</code>, <code>$group</code>, and <code>$sort</code> to compute live totals, status breakdowns, and historical trends directly in the MongoDB engine.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <strong>4</strong>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>Compound Indexing</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 2 }}>
                Compound unique index <code>uq_service_day_token</code> over <code>(service, service_date, token_number)</code> enforces day-service sequence integrity. Compound index <code>ix_queue_lookup</code> accelerates live queue retrieval.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <strong>5</strong>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>Dual-Layer Schema Validation</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 2 }}>
                Application-level validation in Flask combined with strict MongoDB <code>$jsonSchema</code> validation on the <code>tokens</code> collection, preventing invalid statuses or corrupt BSON data types.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <strong>6</strong>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>Query Optimization & Execution Plans</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: 2 }}>
                Reproducible analysis via <code>explain("executionStats")</code> proving <code>IXSCAN</code> index traversal over full collection scans (<code>COLLSCAN</code>) with optimal 1:1 keys-to-documents examined efficiency.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
