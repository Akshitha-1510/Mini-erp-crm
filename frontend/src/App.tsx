import React, { useState, useEffect } from 'react';
import { User } from './types';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { ChallansView } from './components/ChallansView';
import { authService } from './services/api';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    const token = localStorage.getItem('erp_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('erp_user');
        localStorage.removeItem('erp_token');
      }
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#9ca3af' }}>
        Initializing Mini ERP + CRM Portal...
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView user={user} onNavigate={setActiveTab} />}
        {activeTab === 'customers' && <CustomersView user={user} />}
        {activeTab === 'products' && <ProductsView user={user} />}
        {activeTab === 'challans' && <ChallansView user={user} />}
      </main>
    </div>
  );
};

export default App;
