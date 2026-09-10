import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { StockLogs } from './pages/StockLogs';
import { Challans } from './pages/Challans';
import { Account } from './pages/Account';
import { History as HistoryPage } from './pages/History';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-main)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="loading-spinner" style={{ width: '36px', height: '36px' }} />
        <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Initializing Operations Enterprise Session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Execution View */}
      <div className="main-content">
        <Navbar />

        <main className="main-viewport" key={currentTab}>
          {currentTab === 'dashboard' && (
            <div className="page-scrollable">
              <Dashboard onNavigate={setCurrentTab} />
            </div>
          )}
          {currentTab === 'customers' && <Customers />}
          {currentTab === 'products' && (
            <div className="page-scrollable">
              <Products />
            </div>
          )}
          {currentTab === 'stock-logs' && (
            <div className="page-scrollable">
              <StockLogs />
            </div>
          )}
          {currentTab === 'challans' && <Challans />}
          {currentTab === 'account' && (
            <div className="page-scrollable">
              <Account />
            </div>
          )}
          {currentTab === 'history' && (
            <div className="page-scrollable">
              <HistoryPage />
            </div>
          )}
          {currentTab === 'notifications' && (
            <div className="page-scrollable">
              <Notifications onNavigate={setCurrentTab} />
            </div>
          )}
          {currentTab === 'settings' && (
            <div className="page-scrollable">
              <Settings />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
