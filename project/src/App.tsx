import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionDetail } from './components/TransactionDetail';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { MEVTransaction, MEVStats } from './types';
import { apiClient } from './services/api';

function App() {
  const [transactions, setTransactions] = useState<MEVTransaction[]>([]);
  const [stats, setStats] = useState<MEVStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Initial data load
    loadData();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (isMonitoring) {
        loadData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const loadData = async () => {
    try {
      const [txData, statsData] = await Promise.all([
        apiClient.getTransactions(),
        apiClient.getStats()
      ]);
      
      setTransactions(txData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    try {
      await apiClient.startMonitoring();
      setIsMonitoring(true);
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    try {
      await apiClient.stopMonitoring();
      setIsMonitoring(false);
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-300 mt-4 text-lg">Loading Solana MEV Decoder...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    transactions={transactions}
                    stats={stats}
                    isMonitoring={isMonitoring}
                    onStartMonitoring={startMonitoring}
                    onStopMonitoring={stopMonitoring}
                  />
                } 
              />
              <Route 
                path="/transactions" 
                element={<TransactionList transactions={transactions} />} 
              />
              <Route 
                path="/transactions/:signature" 
                element={<TransactionDetail />} 
              />
              <Route 
                path="/analytics" 
                element={<Analytics transactions={transactions} stats={stats} />} 
              />
              <Route 
                path="/settings" 
                element={<Settings />} 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;