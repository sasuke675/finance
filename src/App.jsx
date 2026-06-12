import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import DashboardView from './views/DashboardView';
import LedgerView from './views/LedgerView';
import DebtView from './views/DebtView';
import AnalyticsView from './views/AnalyticsView';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Header */}
        <header className="app-header" id="app-header">
          <div>
            <div className="app-header__title">FinanceKu</div>
            <div className="app-header__subtitle">Manajemen Keuangan Konter</div>
          </div>
        </header>

        {/* Page Content */}
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/ledger" element={<LedgerView />} />
          <Route path="/debts" element={<DebtView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
        </Routes>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
