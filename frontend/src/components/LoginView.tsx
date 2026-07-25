import React, { useState } from 'react';
import { authService } from '../services/api';
import { User } from '../types';
import { LogIn, Shield, Users, Warehouse, FileSpreadsheet, KeyRound, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.login(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setLoading(true);
    setError('');

    try {
      const res = await authService.login(roleEmail, 'password123');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0b0f19 70%)'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }} className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
          }}>
            <LogIn size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Mini ERP + CRM Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Wholesale & Distribution Operations Management
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field input-field-normal"
              placeholder="user@erp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field input-field-normal"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ margin: '2rem 0 1rem 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ borderColor: 'var(--border-color)', margin: 0 }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#111827',
            padding: '0 0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 600
          }}>
            1-CLICK DEMO ROLE LOGIN
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={() => handleQuickLogin('admin@erp.com')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <Shield size={16} color="#ef4444" />
            <span>Admin</span>
          </button>

          <button
            onClick={() => handleQuickLogin('sales@erp.com')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            <Users size={16} color="#3b82f6" />
            <span>Sales</span>
          </button>

          <button
            onClick={() => handleQuickLogin('warehouse@erp.com')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            <Warehouse size={16} color="#f59e0b" />
            <span>Warehouse</span>
          </button>

          <button
            onClick={() => handleQuickLogin('accounts@erp.com')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
          >
            <FileSpreadsheet size={16} color="#10b981" />
            <span>Accounts</span>
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <KeyRound size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Default Password for all preset roles: <strong style={{ color: 'var(--text-secondary)' }}>password123</strong>
        </div>

      </div>
    </div>
  );
};
