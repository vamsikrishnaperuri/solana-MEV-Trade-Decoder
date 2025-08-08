import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  List, 
  BarChart3, 
  Settings, 
  Activity,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/transactions', icon: List, label: 'Transactions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Activity className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-white">MEV Decoder</h1>
            <p className="text-sm text-gray-400">Solana</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">Live MEV</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-lg font-bold text-green-400">$1,247.89</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Last 24h profit</p>
        </div>
      </div>
    </div>
  );
};