import React from 'react';
import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-react';
import { MEVTransaction, MEVStats } from '../types';
import { ProfitChart } from './ProfitChart';

interface AnalyticsProps {
  transactions: MEVTransaction[];
  stats: MEVStats | null;
}

export const Analytics: React.FC<AnalyticsProps> = ({ transactions, stats }) => {
  const mevTransactions = transactions.filter(tx => tx.is_mev);
  
  // Calculate hourly distribution
  const hourlyDistribution = mevTransactions.reduce((acc, tx) => {
    const hour = new Date(tx.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Top platforms by usage
  const platformUsage = mevTransactions.reduce((acc, tx) => {
    tx.platforms.forEach(platform => {
      acc[platform] = (acc[platform] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topPlatforms = Object.entries(platformUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Deep dive into MEV patterns and trends</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-2 text-blue-400 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats ? ((stats.mev_transactions / Math.max(stats.total_transactions, 1)) * 100).toFixed(1) : '0'}%
          </div>
          <p className="text-xs text-gray-400 mt-1">MEV detection rate</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-2 text-green-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Best Trade</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${Math.max(...mevTransactions.map(tx => tx.profit_usdc), 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Highest single profit</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-2 text-purple-400 mb-2">
            <PieChart className="w-5 h-5" />
            <span className="font-medium">Top Pattern</span>
          </div>
          <div className="text-2xl font-bold text-white capitalize">
            {stats && stats.patterns ? 
              Object.entries(stats.patterns).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
              : 'N/A'
            }
          </div>
          <p className="text-xs text-gray-400 mt-1">Most common MEV type</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-2 text-orange-400 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Avg per Hour</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {(mevTransactions.length / Math.max(Object.keys(hourlyDistribution).length, 1)).toFixed(1)}
          </div>
          <p className="text-xs text-gray-400 mt-1">MEV transactions</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Timeline */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Profit Timeline</h2>
          <ProfitChart transactions={mevTransactions} />
        </div>

        {/* Platform Usage */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Top Platforms</h2>
          <div className="space-y-4">
            {topPlatforms.map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-gray-300">{platform}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${(count / Math.max(...topPlatforms.map(([,c]) => c))) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Activity by Hour (UTC)</h2>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, i) => {
              const count = hourlyDistribution[i] || 0;
              const maxCount = Math.max(...Object.values(hourlyDistribution), 1);
              const intensity = count / maxCount;
              
              return (
                <div key={i} className="text-center">
                  <div 
                    className="w-8 h-8 mx-auto rounded bg-blue-500 mb-1"
                    style={{ opacity: 0.2 + (intensity * 0.8) }}
                    title={`${i}:00 - ${count} transactions`}
                  />
                  <span className="text-xs text-gray-400">{i}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern Breakdown */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">MEV Pattern Distribution</h2>
          <div className="space-y-3">
            {stats?.patterns && Object.entries(stats.patterns).map(([pattern, count]) => {
              const percentage = (count / stats.mev_transactions) * 100;
              return (
                <div key={pattern} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 capitalize">{pattern}</span>
                    <span className="text-white">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};