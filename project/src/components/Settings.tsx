import React, { useState } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    minProfitThreshold: 0.01,
    maxTransactions: 1000,
    updateInterval: 5,
    enableNotifications: true,
    enableAutoStart: false,
    darkMode: true
  });
  
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('mev-decoder-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings({
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      minProfitThreshold: 0.01,
      maxTransactions: 1000,
      updateInterval: 5,
      enableNotifications: true,
      enableAutoStart: false,
      darkMode: true
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your MEV decoder preferences</p>
      </div>

      {/* API Configuration */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Solana RPC URL
            </label>
            <input
              type="text"
              value={settings.rpcUrl}
              onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              RPC endpoint for Solana blockchain data
            </p>
          </div>
        </div>
      </div>

      {/* Detection Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Detection Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Profit Threshold (USDC)
            </label>
            <input
              type="number"
              step="0.001"
              value={settings.minProfitThreshold}
              onChange={(e) => setSettings({ ...settings, minProfitThreshold: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimum profit to consider as MEV
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Transactions to Store
            </label>
            <input
              type="number"
              value={settings.maxTransactions}
              onChange={(e) => setSettings({ ...settings, maxTransactions: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Maximum transactions to keep in memory
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Update Interval (seconds)
            </label>
            <input
              type="number"
              min="1"
              value={settings.updateInterval}
              onChange={(e) => setSettings({ ...settings, updateInterval: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              How often to check for new transactions
            </p>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Application Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Enable Notifications
              </label>
              <p className="text-xs text-gray-400">
                Show browser notifications for high-profit MEV
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Auto-start Monitoring
              </label>
              <p className="text-xs text-gray-400">
                Start monitoring automatically when app loads
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAutoStart}
                onChange={(e) => setSettings({ ...settings, enableAutoStart: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          <span>{saved ? 'Saved!' : 'Save Settings'}</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
        <div>
          <p className="text-yellow-200 text-sm font-medium">Configuration Note</p>
          <p className="text-yellow-200/80 text-sm mt-1">
            Changes to RPC settings require restarting the monitoring service to take effect.
          </p>
        </div>
      </div>
    </div>
  );
};