import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { MEVTransaction } from '../types';
import { RecentTransactions } from './RecentTransactions';

interface TransactionListProps {
  transactions: MEVTransaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMEV, setFilterMEV] = useState<'all' | 'mev' | 'non-mev'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'profit' | 'pattern'>('timestamp');

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesSearch = tx.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.trade_path.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterMEV === 'all' || 
                           (filterMEV === 'mev' && tx.is_mev) ||
                           (filterMEV === 'non-mev' && !tx.is_mev);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          return b.profit_usdc - a.profit_usdc;
        case 'pattern':
          return (a.pattern || '').localeCompare(b.pattern || '');
        case 'timestamp':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">All Transactions</h1>
          <p className="text-gray-400 mt-1">
            {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by signature, wallet, or path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            />
          </div>

          {/* MEV Filter */}
          <select
            value={filterMEV}
            onChange={(e) => setFilterMEV(e.target.value as any)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
          >
            <option value="all">All Transactions</option>
            <option value="mev">MEV Only</option>
            <option value="non-mev">Non-MEV Only</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="profit">Sort by Profit</option>
            <option value="pattern">Sort by Pattern</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <RecentTransactions transactions={filteredTransactions} />
      </div>
    </div>
  );
};