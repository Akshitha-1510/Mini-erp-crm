import React from 'react';
import { Download, Terminal, Database, Server, Shield, Layers, FileCode, ExternalLink } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const handleDownloadPostman = () => {
    const link = document.createElement('a');
    link.href = '/postman_collection.json';
    link.download = 'Mini_ERP_CRM_Postman_Collection.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const endpoints = [
    { method: 'POST', path: '/api/auth/login', desc: 'User login with email & password, returns JWT token & user payload', role: 'Public' },
    { method: 'GET', path: '/api/auth/me', desc: 'Get authenticated user profile details', role: 'All Authenticated' },
    { method: 'GET', path: '/api/customers', desc: 'List customers with search, status & type filter, pagination', role: 'All Authenticated' },
    { method: 'POST', path: '/api/customers', desc: 'Add new customer (Name, Mobile, Business Name, GST, Type, Status)', role: 'Admin, Sales' },
    { method: 'GET', path: '/api/customers/:id', desc: 'Get customer detail page with notes log timeline & challan history', role: 'All Authenticated' },
    { method: 'PUT', path: '/api/customers/:id', desc: 'Update customer details', role: 'Admin, Sales' },
    { method: 'POST', path: '/api/customers/:id/notes', desc: 'Add CRM follow-up note to customer profile', role: 'Admin, Sales, Accounts' },
    { method: 'GET', path: '/api/products', desc: 'List products with category & low-stock filter', role: 'All Authenticated' },
    { method: 'POST', path: '/api/products', desc: 'Create new product entry in catalog', role: 'Admin, Warehouse' },
    { method: 'PUT', path: '/api/products/:id', desc: 'Update product details, SKU, price, min stock alert', role: 'Admin, Warehouse' },
    { method: 'POST', path: '/api/products/:id/adjust-stock', desc: 'Manual Stock Movement Adjustment (IN/OUT) with reason', role: 'Admin, Warehouse' },
    { method: 'GET', path: '/api/products/movements/log', desc: 'Audit log history of all stock movements', role: 'All Authenticated' },
    { method: 'GET', path: '/api/challans', desc: 'List sales challans with search & status filter', role: 'All Authenticated' },
    { method: 'POST', path: '/api/challans', desc: 'Create Sales Challan (stores product snapshots, atomic stock deduction if Confirmed)', role: 'Admin, Sales' },
    { method: 'PUT', path: '/api/challans/:id/status', desc: 'Update status (Draft -> Confirmed / Cancelled) with transactional stock update', role: 'All Authenticated' },
    { method: 'GET', path: '/api/dashboard/stats', desc: 'Get executive metrics, KPI summaries, and low-stock alerts', role: 'All Authenticated' }
  ];

  const credentials = [
    { role: 'ADMIN', email: 'admin@erp.com', pass: 'password123', perm: 'Full system read/write access' },
    { role: 'SALES', email: 'sales@erp.com', pass: 'password123', perm: 'Customer CRM & Sales Challan creation' },
    { role: 'WAREHOUSE', email: 'warehouse@erp.com', pass: 'password123', perm: 'Product catalog & Stock adjustments (IN/OUT)' },
    { role: 'ACCOUNTS', email: 'accounts@erp.com', pass: 'password123', perm: 'Challan review, billing & follow-up notes' }
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">API & Architecture Hub</h1>
          <p className="page-subtitle">Complete REST API contracts, role test credentials, database schema, and deployment guides</p>
        </div>

        <button onClick={handleDownloadPostman} className="btn btn-primary">
          <Download size={16} /> Download Postman Collection
        </button>
      </div>

      {/* Credentials Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="var(--accent-blue)" /> Test Role Credentials Matrix
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {credentials.map((c) => (
            <div key={c.role} className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className={`badge ${
                  c.role === 'ADMIN' ? 'badge-role-admin' :
                  c.role === 'SALES' ? 'badge-role-sales' :
                  c.role === 'WAREHOUSE' ? 'badge-role-warehouse' : 'badge-role-accounts'
                }`}>{c.role}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Password: {c.pass}</span>
              </div>
              <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{c.perm}</div>
            </div>
          ))}
        </div>
      </div>

      {/* REST API Endpoints Catalog */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={20} color="var(--accent-emerald)" /> REST API Endpoints Reference
        </h2>

        <div className="table-container glass-card" style={{ padding: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint Path</th>
                <th>Description</th>
                <th>Required Role</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="badge" style={{
                      background: ep.method === 'POST' ? 'rgba(59,130,246,0.2)' : ep.method === 'PUT' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                      color: ep.method === 'POST' ? '#93c5fd' : ep.method === 'PUT' ? '#fde047' : '#6ee7b7'
                    }}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ep.path}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{ep.desc}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ep.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture & DB Design Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="var(--accent-purple)" /> Database Models & Business Logic
          </h3>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>User Model:</strong> Stores email, bcrypt hashed password, and role enum (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).</li>
            <li><strong>Customer CRM:</strong> Tracks contact person, business name, GST number, type (Retail/Wholesale/Distributor), status (Lead/Active/Inactive), follow-up date, and timeline notes.</li>
            <li><strong>Product Inventory:</strong> SKU (unique), unit price, current stock, min stock alert threshold, and warehouse location.</li>
            <li><strong>Stock Movement Log:</strong> Audit log tracking IN/OUT movements, quantity, timestamp, created by user, and reason.</li>
            <li><strong>Sales Challan:</strong> Stores auto-generated `CH-YYYYMMDD-XXXX` number, product snapshots (JSON string), line items, total quantity, total amount, and status (`Draft`, `Confirmed`, `Cancelled`).</li>
            <li><strong>Atomic Stock Transaction:</strong> Stock reduction is wrapped in database transactions during Challan confirmation to guarantee zero negative stock errors.</li>
          </ul>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} color="var(--accent-cyan)" /> Free Deployment Setup Guide
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>1. Frontend (Vercel / Netlify / Render Static):</strong>
              <div style={{ fontSize: '0.8125rem' }}>Build Command: <code>npm run build</code> | Output Dir: <code>dist</code></div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>2. Backend (Render / Railway / Fly.io):</strong>
              <div style={{ fontSize: '0.8125rem' }}>Start Command: <code>npm run prisma:db:push && npm start</code></div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>3. Database (Neon Postgres / Supabase / Render Postgres):</strong>
              <div style={{ fontSize: '0.8125rem' }}>Set <code>DATABASE_URL</code> environment variable in backend dashboard.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
