import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useQuery } from 'react-query';
import { getWalletData } from '../services/api';
import { WalletInsights } from '../components/WalletInsights';

export const InsightsPage: React.FC = () => {
  const [address, setAddress] = useState('');
  const [searchedAddress, setSearchedAddress] = useState('');

  const { data, isLoading, error } = useQuery(
    ['wallet', searchedAddress],
    () => searchedAddress ? getWalletData(searchedAddress) : null,
    { enabled: !!searchedAddress }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedAddress(address);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Insights</h1>
        <p className="mt-2 text-gray-600">
          Enter a ZCash wallet address to view detailed insights and transaction history
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-2xl mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter ZCash wallet address"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Search className="h-5 w-5" />
            Search
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load wallet data</span>
        </div>
      )}

      {data && <WalletInsights data={data} />}
    </div>
  );
};