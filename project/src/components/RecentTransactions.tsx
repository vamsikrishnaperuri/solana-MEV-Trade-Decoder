import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { MEVTransaction } from '../types';

interface RecentTransactionsProps {
  transactions: MEVTransaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const txTime = new Date(timestamp);
    const diffMs = now.getTime() - txTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!transactions.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No transactions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div key={tx.signature} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${tx.is_mev ? 'bg-green-400' : 'bg-gray-400'}`} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm text-gray-300">
                      {truncateAddress(tx.signature)}
                    </span>
                    <Link 
                      to={`/transactions/${tx.signature}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(tx.timestamp)}</span>
                    </div>
                    
                    <span>{truncateAddress(tx.wallet)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 flex items-center space-x-4">
                <div className="text-sm text-gray-300">
                  {tx.trade_path || `${tx.input_token} → ${tx.output_token}`}
                </div>
                
                {tx.platforms.length > 0 && (
                  <div className="flex space-x-1">
                    {tx.platforms.map((platform) => (
                      <span 
                        key={platform}
                        className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className={`flex items-center space-x-1 ${
                tx.profit_usdc > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">{tx.profit_usdc.toFixed(4)}</span>
              </div>
              
              {tx.pattern && (
                <span className="text-xs text-orange-400 capitalize">
                  {tx.pattern}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};