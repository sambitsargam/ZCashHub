/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { WalletData, WalletEvent, TransactionData } from '../types/api';
import { useQuery } from 'react-query';
import { getTransactionDetails } from '../services/api';
import { TransactionDetails } from './TransactionDetails';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Props {
  data: WalletData;
}

export const WalletInsights: React.FC<Props> = ({ data }) => {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const { data: txData } = useQuery<TransactionData>(
    ['transaction', selectedTx],
    () => selectedTx ? getTransactionDetails(selectedTx) : Promise.reject('No transaction selected'),
    { enabled: !!selectedTx }
  );

  const formatZEC = (value: string) => {
    const amount = parseInt(value) / 100000000;
    return amount.toFixed(8);
  };

  const getEventType = (effect: string) => {
    return effect.startsWith('+') ? 'incoming' : 'outgoing';
  };

  const walletStats = useMemo(() => {
    let totalReceived = 0;
    let totalSent = 0;
    let transactionCount = 0;
    const dailyBalances: Record<string, number> = {};
    const volumeData: Array<{ date: string; volume: number }> = [];

    data.events['zcash-main'].forEach(event => {
      const amount = parseInt(event.effect);
      const date = format(new Date(event.time), 'yyyy-MM-dd');
      
      if (amount > 0) {
        totalReceived += amount;
      } else {
        totalSent += Math.abs(amount);
      }

      // Track daily volumes
      volumeData.push({
        date: format(new Date(event.time), 'MMM d'),
        volume: Math.abs(amount) / 100000000
      });

      transactionCount++;
    });

    return {
      totalReceived: formatZEC(totalReceived.toString()),
      totalSent: formatZEC(totalSent.toString()),
      transactionCount,
      volumeData: volumeData.slice(-7).reverse() // Last 7 days
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Wallet Overview</h2>
              <p className="text-sm text-gray-500">{data.address.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Total Received</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                {walletStats.totalReceived} ZEC
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Total Sent</span>
              </div>
              <div className="text-xl font-bold text-red-600">
                {walletStats.totalSent} ZEC
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Current Balance</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatZEC(data.balances['zcash-main'].zcash.balance)} ZEC
            </div>
          </div>
        </motion.div>

        {/* Transaction Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Transaction Volume</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={walletStats.volumeData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#9333ea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Balance History Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {data.events['zcash-main'].map((event: WalletEvent) => (
            <motion.div
              key={`${event.transaction}-${event.sort_key}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getEventType(event.effect) === 'incoming' ? (
                  <ArrowDownRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {getEventType(event.effect) === 'incoming' ? 'Received' : 'Sent'} {formatZEC(event.effect.replace('+', '').replace('-', ''))} ZEC
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(event.time), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(event.transaction)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {txData && (
        <TransactionDetails
          data={txData}
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};