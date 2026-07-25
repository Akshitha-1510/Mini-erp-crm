import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { DashboardStats, User } from '../types';
import { 
  DollarSign, Users, AlertTriangle, FileText, ArrowUpRight, ArrowDownRight, 
  Plus, Package, Clock, ShieldCheck, UserCheck 
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '4rem' }}>Loading Dashboard Metrics...</div>;
  }

  const summary = stats?.summary;

  return (
    <div className="page-wrapper">
      {/* Header & Quick Action Buttons */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.name} ({user.role} Access)</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(user.role === 'ADMIN' || user.role === 'SALES') && (
            <button onClick={() => onNavigate('challans')} className="btn btn-primary">
              <Plus size={16} /> New Sales Challan
            </button>
          )}
          {(user.role === 'ADMIN' || user.role === 'WAREHOUSE') && (
            <button onClick={() => onNavigate('products')} className="btn btn-emerald">
              <Package size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="kpi-value">${summary?.totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="kpi-label">Total Confirmed Sales</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-box kpi-icon-blue">
            <Users size={24} />
          </div>
          <div>
            <div className="kpi-value">{summary?.totalCustomers}</div>
            <div className="kpi-label">{summary?.activeCustomers} Active / {summary?.leadCustomers} Leads</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-box kpi-icon-amber">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: (summary?.lowStockCount || 0) > 0 ? '#f87171' : 'inherit' }}>
              {summary?.lowStockCount} Products
            </div>
            <div className="kpi-label">Low Stock Alerts</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-box kpi-icon-purple">
            <FileText size={24} />
          </div>
          <div>
            <div className="kpi-value">{summary?.totalChallans}</div>
            <div className="kpi-label">{summary?.confirmedChallansCount} Confirmed / {summary?.draftChallansCount} Drafts</div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              background: '#ef4444',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: '#fca5a5' }}>
                Inventory Alert: {stats.lowStockAlerts.length} Product(s) Below Minimum Stock Level
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#f87171', marginTop: '0.2rem' }}>
                Reorder needed for: {stats.lowStockAlerts.map(p => `${p.name} (Qty: ${p.currentStock}/${p.minStockAlert})`).join(', ')}
              </p>
            </div>
          </div>

          <button onClick={() => onNavigate('products')} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}>
            Manage Inventory
          </button>
        </div>
      )}

      {/* Activity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Stock Movement Logs */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="var(--accent-amber)" /> Recent Stock Movements
            </h3>
            <button onClick={() => onNavigate('products')} className="btn btn-secondary btn-sm">View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.activityFeed.stockMovements.map((sm) => (
              <div key={sm.id} style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sm.product?.name || 'Product'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sm.reason} • {sm.createdBy}</div>
                </div>
                <span className={`badge ${sm.type === 'IN' ? 'badge-active' : 'badge-cancelled'}`}>
                  {sm.type === 'IN' ? '+' : '-'}{sm.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent CRM Customer Notes */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--accent-blue)" /> Recent CRM Follow-ups
            </h3>
            <button onClick={() => onNavigate('customers')} className="btn btn-secondary btn-sm">View CRM</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.activityFeed.notes.map((note) => (
              <div key={note.id} style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                  <strong style={{ color: 'var(--accent-blue)' }}>{note.customer?.businessName}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{note.note}</p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: 'right' }}>
                  By: {note.createdBy}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales Challans */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--accent-purple)" /> Recent Challans
            </h3>
            <button onClick={() => onNavigate('challans')} className="btn btn-secondary btn-sm">View Challans</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.activityFeed.recentChallans.map((ch) => (
              <div key={ch.id} style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ch.challanNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ch.customer?.businessName} • Qty: {ch.totalQuantity}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>${ch.totalAmount.toFixed(2)}</div>
                  <span className={`badge ${ch.status === 'Confirmed' ? 'badge-confirmed' : ch.status === 'Draft' ? 'badge-draft' : 'badge-cancelled'}`}>
                    {ch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
