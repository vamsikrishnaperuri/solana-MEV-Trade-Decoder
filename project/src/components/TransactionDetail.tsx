import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { MEVTransaction } from '../types';
import { apiClient } from '../services/api';

export const TransactionDetail: React.FC = () => {
  const { signature } = useParams<{ signature: string }>();
  const [transaction, setTransaction] = useState<MEVTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (signature) {
      loadTransaction(signature);
    }
  }, [signature]);

  const loadTransaction = async (sig: string) => {
    try {
      const tx = await apiClient.getTransactionDetail(sig);
      setTransaction(tx);
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">Transaction not found</p>
          <Link to="/transactions" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            ← Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/transactions"
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Transactions</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white">Transaction Details</h1>
        <p className="text-gray-400 mt-1">Detailed analysis and breakdown</p>
      </div>

      {/* Transaction Overview */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Signature</label>
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {transaction.signature}
                  </code>
                  <button
                    onClick={() => copyToClipboard(transaction.signature, 'signature')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'signature' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Wallet</label>
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {transaction.wallet}
                  </code>
                  <button
                    onClick={() => copyToClipboard(transaction.wallet, 'wallet')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'wallet' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Timestamp</label>
                <p className="text-white">{new Date(transaction.timestamp).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-sm text-gray-400">Slot</label>
                <p className="text-white">{transaction.slot.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">MEV Analysis</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Is MEV</label>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${transaction.is_mev ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`font-medium ${transaction.is_mev ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.is_mev ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {transaction.pattern && (
                <div>
                  <label className="text-sm text-gray-400">Pattern</label>
                  <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-sm capitalize">
                    {transaction.pattern}
                  </span>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400">Confidence</label>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                      style={{ width: `${transaction.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">{(transaction.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Profit (USDC)</label>
                <p className={`text-xl font-bold ${
                  transaction.profit_usdc > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${transaction.profit_usdc.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Trade Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-400">Trade Path</label>
            <p className="text-lg font-medium text-white">
              {transaction.trade_path || `${transaction.input_token} → ${transaction.output_token}`}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-400">Platforms Used</label>
            <div className="flex flex-wrap gap-2">
              {transaction.platforms.map((platform) => (
                <span 
                  key={platform}
                  className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Input</label>
            <p className="text-white">
              {transaction.input_amount.toFixed(6)} {transaction.input_token}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-400">Output</label>
            <p className="text-white">
              {transaction.output_amount.toFixed(6)} {transaction.output_token}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {transaction.explanation && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Analysis Explanation</h2>
          <p className="text-gray-300 leading-relaxed">{transaction.explanation}</p>
        </div>
      )}

      {/* External Links */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">External Links</h2>
        <div className="flex space-x-4">
          <a
            href={`https://solscan.io/tx/${transaction.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View on Solscan</span>
          </a>
          
          <a
            href={`https://solana.fm/tx/${transaction.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View on SolanaFM</span>
          </a>
        </div>
      </div>
    </div>
  );
};