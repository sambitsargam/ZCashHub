import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Bell, Home, Bot } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-purple-600" />
              <span className="font-bold text-xl text-gray-900">ZcashHub</span>
            </Link>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                isActive('/') 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
            <Link
              to="/insights"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                isActive('/insights')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Insights
            </Link>
            <Link
              to="/alerts"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                isActive('/alerts')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Link>
            <Link
              to="/ai-agent"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                isActive('/ai-agent')
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Agent
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};