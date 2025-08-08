import React from 'react';
import { Play, Pause, Activity, DollarSign, TrendingUp, Target } from 'lucide-react';
import { MEVTransaction, MEVStats } from '../types';
import { StatCard } from './StatCard';
import { RecentTransactions } from './RecentTransactions';
import { ProfitChart } from './ProfitChart';

interface DashboardProps {
  transactions: MEVTransaction[];
  stats: MEVStats | null;
  isMonitoring: boolean;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  stats,
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">MEV Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time Solana MEV transaction monitoring</p>
        </div>
        
        <button
          onClick={isMonitoring ? onStopMonitoring : onStartMonitoring}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isMonitoring
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isMonitoring ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}</span>
        </button>
      </div>

      {/* Status Indicator */}
      <div className={`flex items-center space-x-2 p-3 rounded-lg ${
        isMonitoring ? 'bg-green-900/20 border border-green-500/20' : 'bg-gray-800 border border-gray-600'
      }`}>
        <Activity className={`w-5 h-5 ${isMonitoring ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
        <span className={`font-medium ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
          {isMonitoring ? 'Live monitoring active' : 'Monitoring stopped'}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={stats?.total_transactions.toString() || '0'}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="MEV Transactions"
          value={stats?.mev_transactions.toString() || '0'}
          icon={Target}
          color="orange"
          subtitle={`${stats?.mev_percentage.toFixed(1) || '0'}% of total`}
        />
        <StatCard
          title="Total Profit"
          value={`$${stats?.total_profit.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Avg Profit"
          value={`$${stats?.avg_profit.toFixed(4) || '0.0000'}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Profit Trends</h2>
          <ProfitChart transactions={transactions} />
        </div>

        {/* Pattern Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">MEV Patterns</h2>
          <div className="space-y-3">
            {stats?.patterns && Object.entries(stats.patterns).map(([pattern, count]) => (
              <div key={pattern} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{pattern}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(stats.patterns))) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
          <span className="text-sm text-gray-400">Last 10 transactions</span>
        </div>
        <RecentTransactions transactions={transactions.slice(0, 10)} />
      </div>
    </div>
  );
};